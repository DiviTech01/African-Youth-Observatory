FROM node:20-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies with npm (not pnpm)
RUN cd apps/api && npm install --legacy-peer-deps
RUN cd packages/database && npm install
RUN cd packages/shared && npm install

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build the API
RUN cd apps/api && npm run build

# Expose port
EXPOSE 3001

# Start
CMD ["node", "apps/api/dist/main.js"]
