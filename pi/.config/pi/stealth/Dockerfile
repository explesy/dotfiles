FROM mcr.microsoft.com/playwright/python:v1.61.0-noble

USER root

RUN pip install --no-cache-dir \
    invisible-playwright-mcp==0.70.9 \
    invisible-playwright==0.26.0

USER pwuser

ENV HOME=/home/pwuser \
    XDG_CACHE_HOME=/data/cache \
    INVISIBLE_MCP_HOME=/data/mcp \
    STEALTHFOX_PROFILE_DIR=/data/profile \
    STEALTHFOX_MCP_TRANSPORT=http \
    STEALTHFOX_MCP_HOST=0.0.0.0 \
    STEALTHFOX_MCP_PORT=8766 \
    STEALTHFOX_HEADLESS=1

EXPOSE 8766

CMD ["invisible-playwright-mcp"]
