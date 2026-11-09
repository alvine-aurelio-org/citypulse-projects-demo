# Security and demo boundaries

This private repository contains fictional project-planning data and maintainer
tooling. It does not host a real citizen service, collect citizen information,
or provide a production authentication or deployment system.

Do not add real resident data, passwords, API keys, access tokens, or organization
secrets. Maintainer scripts use the existing GitHub CLI credential store; credentials
are neither read into files nor passed to GitHub Actions. Use GitHub's normal access
controls and authentication rather than sharing credentials.

Report a suspected vulnerability privately to the repository owner. Do not place
secrets or personal information in public issue descriptions or attachments.
