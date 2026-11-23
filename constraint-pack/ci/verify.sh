#!/bin/sh
# Executed by the trusted host, not the generation Agent. Do not ignore nonzero exit codes.
set -eu
: "${DESIGN_PACK_ROOT:?Set trusted, read-only constraint pack directory}"
: "${DESIGN_REVIEW_PUBLIC_KEY:?Set trusted reviewer public key path}"
: "${DESIGN_SPEC_PATH:?Set design SPEC path}"
: "${MINIAPP_PROJECT_PATH:?Set project path}"
: "${DESIGN_SIGNED_REVIEW:?Set signed review path}"
node "$DESIGN_PACK_ROOT/scripts/gate.mjs" --spec "$DESIGN_SPEC_PATH" --project "$MINIAPP_PROJECT_PATH" --review "$DESIGN_SIGNED_REVIEW"
