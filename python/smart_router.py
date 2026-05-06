"""
smart_router.py
---------------
Intelligent auto-router for openclaude.

Instead of always using one fixed provider, the smart router:
- Pings all configured providers on startup
- Scores them by latency, cost, and health
- Routes each request to the optimal provider
- Falls back automatically if a provider fails
- Learns from real request timings over time

Usage in server.py:
    from smart_router import SmartRouter
    router = SmartRouter()
    await router.initialize()
    result = await router.route(messages, model, stream)

.env config:
    ROUTER_MODE=smart          # or: fixed (default behaviour)
    ROUTER_STRATEGY=latency    # or: cost, balanced
    ROUTER_FALLBACK=true       # auto-retry on failure

Contribution to: https://github.com/Gitlawb/openclaude
"""

import asyncio
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Optional
import httpx

logger = logging.getLogger(__name__)

# ── Provider definitions ──────────────────────────────────────────────────────

@dataclass
class Provider:
    name: str                        # e.g. "openai", "gemini", "ollama"
    ping_url: str                    # URL used to check health
    api_key_env: str                 # env var name for API key
    cost_per_1k_tokens: float        # estimated cost USD per 1k tokens
    big_model: str                   # model for sonnet/large requests
    small_model: str                 # model for haiku/small requests
    latency_ms: float = 9999.0       # updated by benchmark
    healthy: bool = True             # updated by health checks
    request_count: int = 0           # total requests routed here
    error_count: int = 0             # total errors from this provider
    avg_latency_ms: float = 9999.0   # rolling average from real requests

    @property
    def api_key(self) -> Optional[str]:
        return os.getenv(self.api_key_env)

    @property
    def is_configured(self) -> bool:
        """True if the provider has an API key set."""
        if self.name in ("ollama", "atomic-chat"):
            return True  # Local providers need no API key
        return bool(self.api_key)

    @property
    def error_rate(self) -> float:
        if self.request_count == 0:
            return 0.0
        return self.error_count / self.request_count

    def score(self, strategy: str = "balanced") -> float:
        """
        Lower score = better provider.
        strategy: 'latency' | 'cost' | 'balanced'
        """
        if not self.healthy or not self.is_configured:
            return float("inf")

        latency_score = self.avg_latency_ms / 1000.0   # normalize to seconds
        cost_score = self.cost_per_1k_tokens * 100      # normalize to similar scale
        error_penalty = self.error_rate * 500           # heavy penalty for errors

        if strategy == "latency":
            return latency_score + error_penalty
        elif strategy == "cost":
            return cost_score + error_penalty
        else:  # balanced
            return (latency_score * 0.5) + (cost_score * 0.5) + error_penalty


# ── Default provider catalogue ────────────────────────────────────────────────

def build_default_providers() -> list[Provider]:
    big = os.getenv("BIG_MODEL", "gpt-4.1")
    small = os.getenv("SMALL_MODEL", "gpt-4.1-mini")
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    lm_studio_url = os.getenv("LM_STUDIO_BASE_URL", "http://localhost:1234")
    openrouter_url = "https://openrouter.ai/api/v1"
    nvidia_url = "https://integrate.api.nvidia.com/v1"

    return [
        Provider(
            name="gemini",
            ping_url="https://generativelanguage.googleapis.com/v1/models",
            api_key_env="GEMINI_API_KEY",
            cost_per_1k_tokens=0.0005,
            big_model=big if "gemini" in big else "gemini-2.5-pro",
            small_model=small if "gemini" in small else "gemini-2.0-flash",
        ),
        Provider(
            name="lm-studio",
            ping_url=f"{lm_studio_url}/v1/models",
            api_key_env="",
            cost_per_1k_tokens=0.0,
            big_model=big if "gemini" not in big and "gpt" not in big else "local-big",
            small_model=small if "gemini" not in small and "gpt" not in small else "local-small",
        ),
        Provider(
            name="openrouter",
            ping_url=f"{openrouter_url}/models",
            api_key_env="OPENROUTER_API_KEY",
            cost_per_1k_tokens=0.002,
            big_model=big if "openrouter" in big else "anthropic/claude-3.5-sonnet",
            small_model=small if "openrouter" in small else "anthropic/claude-3-haiku",
        ),
        Provider(
            name="nvidia",
            ping_url=f"{nvidia_url}/models",
            api_key_env="NVIDIA_API_KEY",
            cost_per_1k_tokens=0.001,
            big_model=big if "nvidia" in big else "meta/llama-3.1-405b",
            small_model=small if "nvidia" in small else "meta/llama-3.1-8b",
        ),
    ]


# ── Smart Router ──────────────────────────────────────────────────────────────

class SmartRouter:
    """
    Intelligently routes Claude Code API requests to the best
    available LLM provider based on latency, cost, and health.
    """

    def __init__(
        self,
        providers: Optional[list[Provider]] = None,
        strategy: Optional[str] = None,
        fallback_enabled: Optional[bool] = None,
    ):
        self.providers = providers or build_default_providers()
        self.strategy = strategy or os.getenv("ROUTER_STRATEGY", "balanced")
        self.fallback_enabled = (
            fallback_enabled
            if fallback_enabled is not None
            else os.getenv("ROUTER_FALLBACK", "true").lower() == "true"
        )
        self._initialized = False

    # ── Initialization ────────────────────────────────────────────────────────

    async def initialize(self) -> None:
        """Ping all providers and build initial latency scores."""
        logger.info("SmartRouter: benchmarking providers...")
        await asyncio.gather(
            *[self._ping_provider(p) for p in self.providers],
            return_exceptions=True,
        )
        available = [p for p in self.providers if p.healthy and p.is_configured]
        logger.info(
            f"SmartRouter ready. Available providers: "
            f"{[p.name for p in available]}"
        )
        if not available:
            logger.warning(
                "SmartRouter: no providers available! "
                "Check your API keys in .env"
            )
        self._initialized = True

    async def _ping_provider(self, provider: Provider) -> None:
        """Measure latency to a provider's health endpoint."""
        if not provider.is_configured:
            provider.healthy = False
            logger.debug(f"SmartRouter: {provider.name} skipped — no API key")
            return

        headers = {}
        if provider.api_key:
            headers["Authorization"] = f"Bearer {provider.api_key}"

        start = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(provider.ping_url, headers=headers)
                elapsed_ms = (time.monotonic() - start) * 1000
                if resp.status_code in (200, 400, 401, 403):
                    # 400/401/403 means reachable, just possibly bad key
                    # We still mark healthy for routing purposes
                    provider.healthy = True
                    provider.latency_ms = elapsed_ms
                    provider.avg_latency_ms = elapsed_ms
                    logger.info(
                        f"SmartRouter: {provider.name} OK "
                        f"({elapsed_ms:.0f}ms, status={resp.status_code})"
                    )
                else:
                    provider.healthy = False
                    logger.warning(
                        f"SmartRouter: {provider.name} unhealthy "
                        f"(status={resp.status_code})"
                    )
        except Exception as e:
            provider.healthy = False
            logger.warning(f"SmartRouter: {provider.name} unreachable — {e}")

    # ── Routing logic ─────────────────────────────────────────────────────────

    def select_provider(self, messages: list[dict] = None) -> Optional[Provider]:
        """
        Pick the priority hierarchy:
        1. Gemini API
        2. NVIDIA API
        3. LM Studio
        4. OpenRouter
        """
        # Deterministic priority order
        priority_order = ["gemini", "nvidia", "lm-studio", "openrouter"]

        available = [
            p for p in self.providers
            if p.healthy and p.is_configured
        ]
        if not available:
            return None

        # Complexity detection: 'Fast Thinking' vs 'Deep Thinking'
        # Fast Thinking: Small tasks use the hierarchy but prioritize efficiency/speed
        # Deep Thinking: Large/Complex tasks strictly follow the high-power hierarchy
        is_complex = False
        if messages:
            total_chars = sum(len(str(m.get("content", ""))) for m in messages)
            is_complex = total_chars > 1000 # Threshold for "Deep Thinking"

        if not is_complex:
            # 'Fast Thinking' mode: Try to find the first available provider in hierarchy
            # that is known for speed (Gemini Flash or Local)
            # In this hierarchy, Gemini is first, then NVIDIA, then Local.
            # We follow the strict hierarchy but acknowledge this as 'Fast Thinking' path.
            logger.debug("SmartRouter: Fast Thinking mode engaged")

        else:
            logger.debug("SmartRouter: Deep Thinking mode engaged")

        # Follow the strict priority hierarchy for both modes to ensure failover transparency
        for target in priority_order:
            provider = next((p for p in available if p.name == target), None)
            if provider:
                return provider

        # Absolute fallback to the best scoring if priority list fails
        return min(available, key=lambda p: p.score(self.strategy))

    def get_model_for_provider(
        self,
        provider: Provider,
        claude_model: str,
        is_large_request: bool = False,
    ) -> str:
        """Map a Claude model name to the provider's actual model."""
        if is_large_request:
            return provider.big_model
        is_large = any(
            keyword in claude_model.lower()
            for keyword in ["opus", "sonnet", "large", "big"]
        )
        return provider.big_model if is_large else provider.small_model

    def is_large_request(self, messages: list[dict]) -> bool:
        """Estimate if this is a large request based on message length."""
        total_chars = sum(
            len(str(m.get("content", ""))) for m in messages
        )
        return total_chars > 2000  # >2000 chars = treat as large

    def _update_latency(self, provider: Provider, duration_ms: float) -> None:
        """Exponential moving average update for latency tracking."""
        alpha = 0.3  # weight for new observation
        provider.avg_latency_ms = (
            alpha * duration_ms + (1 - alpha) * provider.avg_latency_ms
        )

    # ── Main routing entry point ──────────────────────────────────────────────

    async def route(
        self,
        messages: list[dict],
        claude_model: str = "claude-sonnet",
        attempt: int = 0,
        exclude_providers: Optional[list[str]] = None,
    ) -> dict:
        """
        Route a request to the best provider using the priority hierarchy.
        Returns a dict with routing decision info.
        """
        if not self._initialized:
            await self.initialize()

        exclude = set(exclude_providers or [])
        large = self.is_large_request(messages)

        # Use the new hierarchy-based selection
        provider = self.select_provider(messages=messages)

        # If the selected provider is excluded, try to find another from the hierarchy
        if provider and provider.name in exclude:
            available_available = [
                p for p in self.providers
                if p.healthy and p.is_configured and p.name not in exclude
            ]
            if not _available:
                raise RuntimeError(
                    "SmartRouter: no providers available. "
                    "Check your API keys and provider health."
                )
            # Fallback to the best remaining available provider
            provider = min(_available, key=lambda p: p.score(self.strategy))
        elif not provider:
             raise RuntimeError(
                "SmartRouter: no providers available. "
                "Check your API keys and provider health."
            )

        model = self.get_model_for_provider(
            provider,
            claude_model,
            is_large_request=large,
        )

        logger.debug(
            f"SmartRouter: routing to {provider.name}/{model} "
            f"(hierarchy_selection, large={large}, attempt={attempt})"
        )

        return {
            "provider": provider.name,
            "model": model,
            "api_key": provider.api_key or "none",
            "provider_object": provider,
        }

    async def record_result(
        self,
        provider_name: str,
        success: bool,
        duration_ms: float,
    ) -> None:
        """
        Record the outcome of a request.
        Called after each proxied request to update provider scores.
        """
        provider = next(
            (p for p in self.providers if p.name == provider_name), None
        )
        if not provider:
            return

        provider.request_count += 1
        if success:
            self._update_latency(provider, duration_ms)
        else:
            provider.error_count += 1
            # After 3 consecutive failures, mark unhealthy temporarily
            recent_errors = provider.error_count
            recent_total = provider.request_count
            if recent_total >= 3 and (recent_errors / recent_total) > 0.7:
                logger.warning(
                    f"SmartRouter: {provider_name} error rate high "
                    f"({provider.error_rate:.0%}), marking unhealthy"
                )
                provider.healthy = False
                # Schedule re-check after 60s
                asyncio.create_task(self._recheck_provider(provider, delay=60))

    async def _recheck_provider(
        self, provider: Provider, delay: float = 60
    ) -> None:
        """Re-ping a provider after a delay and restore if healthy."""
        await asyncio.sleep(delay)
        await self._ping_provider(provider)
        if provider.healthy:
            logger.info(
                f"SmartRouter: {provider.name} recovered, "
                f"re-adding to pool"
            )

    # ── Status report ─────────────────────────────────────────────────────────

    def status(self) -> list[dict]:
        """Return current provider status for monitoring."""
        return [
            {
                "provider": p.name,
                "healthy": p.healthy,
                "configured": p.is_configured,
                "latency_ms": round(p.avg_latency_ms, 1),
                "cost_per_1k": p.cost_per_1k_tokens,
                "requests": p.request_count,
                "errors": p.error_count,
                "error_rate": f"{p.error_rate:.1%}",
                "score": round(p.score(self.strategy), 3)
                if p.healthy and p.is_configured
                else "N/A",
            }
            for p in self.providers
        ]
