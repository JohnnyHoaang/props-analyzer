# Props Analyzer API — container image for Cloud Run and other hosts.
#
# Build:
#   docker build -t props-analyzer-api .
#
# Run (Supabase):
#   docker run -p 8080:8080 \
#     -e DATA_SOURCE=supabase \
#     -e SUPABASE_URL=... \
#     -e SUPABASE_SECRET_KEY=... \
#     props-analyzer-api
#
# Run (mock JSON — optional):
#   docker run -p 8080:8080 \
#     -e DATA_SOURCE=mock \
#     -e MOCK_DATA_PATH=/app/mock-data.json \
#     props-analyzer-api

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/api-e2e/package.json apps/api-e2e/
COPY packages/api-client/package.json packages/api-client/
COPY packages/configuration/package.json packages/configuration/
COPY packages/database/package.json packages/database/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/validation/package.json packages/validation/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN pnpm nx run @props-analyzer/api:prune --skip-nx-cache

FROM base AS runner
ENV NODE_ENV=production
ENV CI=true
ENV PORT=8080
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./
COPY --from=builder /app/packages/database/src/mock-data/mock-data.json ./mock-data.json

RUN pnpm install --prod --frozen-lockfile

EXPOSE 8080

CMD ["node", "main.js"]
