#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$(cd "${APP_DIR}/.." && pwd)"
SDK_DIR="${ANDROID_SDK_ROOT:-${PROJECT_DIR}/.android-sdk}"
OUTPUT_DIR="${PROJECT_DIR}/dist"

if [[ ! -x "${SDK_DIR}/platform-tools/adb" ]]; then
  echo "Android SDK not found at ${SDK_DIR}."
  echo "Install it first or set ANDROID_SDK_ROOT."
  exit 1
fi

export ANDROID_HOME="${SDK_DIR}"
export ANDROID_SDK_ROOT="${SDK_DIR}"
export NODE_ENV="production"
export PATH="${SDK_DIR}/platform-tools:${SDK_DIR}/cmdline-tools/latest/bin:${PATH}"

cd "${APP_DIR}"
npx expo prebuild --platform android --clean --no-install

cd "${APP_DIR}/android"
./gradlew assembleRelease

mkdir -p "${OUTPUT_DIR}"
cp "${APP_DIR}/android/app/build/outputs/apk/release/app-release.apk" \
  "${OUTPUT_DIR}/MyDhobi.apk"

echo "APK created at ${OUTPUT_DIR}/MyDhobi.apk"
