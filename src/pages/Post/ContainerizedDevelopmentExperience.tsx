import PostLayout from '../../components/PostLayout';

export default function ContainerizedDevelopmentExperience() {
  return (
    <PostLayout
      slug="containerized-development-experience"
      kicker="Docker · Developer experience"
      title={<>Developer Experience<br /><em>in Containerized Environments</em></>}
      lede="The value of containers doesn't end at matching deployment environments. The bigger value is letting even a newly joined developer run the system quickly, experiment safely, and verify it the same way as everyone else."
    >
      <p>“It works on my machine” is usually a sign that the environment's contract, not the code, was never documented. If the runtime version, database settings, dependent services, seed data, and startup order live only in someone's memory, the team's development speed ends up bottlenecked by whoever is least familiar with the environment.</p>
      <p>Containers are a good tool for moving that contract into code. But putting everything into a Dockerfile doesn't automatically improve the developer experience. You need to design for fast startup, fast reflection of code changes, predictable data, and clear failure messages together, for a containerized environment to actually reduce friction for the team.</p>
      <h2>What Makes a Good Local Environment</h2>
      <p>A good development environment is closer to a single command than a long installation guide in a document. After cloning the repository, <code>docker compose up</code> should start the application and its required dependencies, and once the health checks pass, the API should be callable. Even on failure, you should be able to tell immediately from the logs and status which service isn't ready.</p>
      <p>The word “required” matters here. You don't need to replicate every piece of production infrastructure locally. Prioritize including whatever is needed to validate the contract — a database, message broker, or cache the feature under development actually needs — and things like an observability platform or a large-scale analytics system can be replaced with a mock or a shared development environment.</p>
      <h2>1. Make Compose an Executable Runbook</h2>
      <p>A Compose file isn't a list of containers — it's an executable document that describes the relationships between services. It should expose not just ports, environment variables, and volumes, but also startup order and readiness. Whether a container actually started matters less than whether it's really ready to accept requests.</p>
      <h3>Example: A Compose File That Declares Dependencies and Health Checks</h3>
      <pre><code>{`services:
  api:
    build:
      context: .
      target: development
    command: npm run dev
    ports: ["3000:3000"]
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 3s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 3s
      timeout: 3s
      retries: 10

volumes:
  node_modules:`}</code></pre>
      <p>Instead of waiting only for the database's port to open, the application waits for it to actually be connectable. This reduces unnecessary restarts when a dependent service starts up slowly during development. That said, the application itself must still be able to retry a failed connection — Compose's startup ordering doesn't replace a runtime recovery strategy.</p>
      <h2>2. Separate the Development Image from the Deployment Image</h2>
      <p>A development container should reflect code changes immediately and include debuggers and testing tools. A deployment image, on the other hand, should be small, reproducible, and contain only what's needed to run. Forcing a single image to serve both purposes makes local development slow and the production image unnecessarily large.</p>
      <p>A multi-stage build lets you reuse dependency installation and the build step while keeping the final image small. Locally you pick the development target; CI and production use only the production target. Declaring the runtime user and file permissions at this stage too helps narrow the gap between development and production environments.</p>
      <div className="article-note"><strong>Feedback Loop</strong><p>If it still takes a long time to see the result of changing a single line of code after adopting containers, that's a failure. Measure your local feedback time first, using source volume mounts, file-watch exclusion rules, and dependency caching.</p></div>
      <h2>3. Make Data a Version-Controlled Initialization Process</h2>
      <p>If every developer's database looks different, the same bug becomes hard to reproduce. It's best to manage schema changes through migrations and minimal reference data through seed scripts. Relying on “someone's dump file” increases the risk of exposing sensitive data, and the cost of recreating the environment only grows over time.</p>
      <p>Initialization should be made idempotent. It needs to run safely not only after wiping a container volume, but also on top of existing data. Because test data and data for local manual verification serve different purposes, it's best to keep small, fast fixtures separate from readable sample data.</p>
      <h2>4. Keep Secrets Outside the Image and the Repository</h2>
      <p>Putting an API key into a Compose file or Dockerfile for convenience leaves it lingering in image layers and Git history for a long time. Provide a <code>.env.example</code> whose defaults are safe, and inject real personal keys from local environment variables or a secrets manager. It's also best to use a separate, permission- and usage-limited key just for local development.</p>
      <p>The same principle applies to builds. Values needed only at build time — like a private package registry token — can be passed as a BuildKit secret so they never end up in the final image. The goal of secrets management isn't to make things inconvenient for developers, but to make the safe path the easiest one.</p>
      <h2>5. Re-Verify the Same Contract in CI</h2>
      <p>A local Compose environment is valuable in CI too. Instead of validating the application with unit tests alone, you can run integration tests — including a real database and message broker — with the same configuration. That said, speed matters in CI too, so you don't need to run every test inside a container.</p>
      <p>The recommended flow is to run fast unit tests first, then follow up with the integration tests affected by the changed contract. Image builds and vulnerability scans happen at the pre-deployment stage. The key isn't making local, CI, and production files completely identical — it's sharing a common contract while making environment-specific differences explicit.</p>
      <h2>Development Environment Checklist</h2>
      <ul>
        <li>Can a new developer run the service with one or two commands?</li>
        <li>Are a dependent service's readiness and failure causes visible?</li>
        <li>Is the feedback time after a code change short enough?</li>
        <li>Is the contract for schema, seed data, and environment variables managed in the repository?</li>
        <li>Do secrets stay out of images, logs, and commit history?</li>
        <li>Does CI verify the same core integration contract as local?</li>
      </ul>
      <p>The purpose of a containerized environment isn't to lock developers into production. It's to let anyone experiment quickly from the same starting point, and reproduce the same state when something goes wrong. Once you start treating the environment as part of the product, containers become more than a runtime tool — they become the foundation that supports the team's developer experience.</p>
    </PostLayout>
  );
}
