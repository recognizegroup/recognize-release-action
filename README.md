# Recognize Release Action

This actions acts as a utility to draft releases based on deployments. It can create GitHub Releases
based on the branch it was started from, and generate a report of the JIRA-tickets that are affected by the release.

## Example
```yaml
on:
  deployment
jobs:
  security-report:
    runs-on: ubuntu-latest
    steps:
      - uses: recognizegroup/recognize-release-action@v1
        with:
          token: ${{ github.token }} # Token for the GitHub API
```

## Screenshot
