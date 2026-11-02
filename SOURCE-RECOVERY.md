# Recorder client conflict-stage source archive

This source-only snapshot preserves Git index stage 3 (theirs) for the four conflicted files, combined with the nonconflicting local helper source. The original working tree remains in its unfinished merge state; no merge was resolved or reset. This is a historical source version, not evidence of a completed integration or working runtime.

Credentials, room identifiers and service configuration are supplied by the environment variables listed in `.env.example`. Sessions, dependencies, logs and video are excluded. Validation is static syntax, credential scanning, named-file staging and remote SHA checks; services and recording were not started.
