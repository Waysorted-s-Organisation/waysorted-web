# syntax=docker/dockerfile:1
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM dependencies AS development

ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--turbopack", "--hostname", "0.0.0.0"]

FROM dependencies AS application

COPY app ./app
COPY components ./components
COPY context ./context
COPY data ./data
COPY hooks ./hooks
COPY lib ./lib
COPY models ./models
COPY public ./public
COPY scripts ./scripts
COPY types ./types
COPY middleware.ts next.config.ts next-env.d.ts postcss.config.mjs tailwind.config.ts tsconfig.json ./

ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
