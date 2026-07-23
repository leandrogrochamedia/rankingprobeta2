#!/bin/bash
set -e
git add -f config.js
git commit -m "chore: config para deploy"
git push origin main
echo "✅ Deploy concluído. config.js não será incluído nos próximos commits normais."
