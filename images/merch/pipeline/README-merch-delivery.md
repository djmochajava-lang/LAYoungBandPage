# Merch Delivery Guide

Use this folder to choose the correct file for each channel.

## What To Send

- Printer/manufacturer: `pipeline/print/*-print-master.png` (or `pipeline/manufacturer/*` if they ask for specific background handling).
- Shopify product image: `pipeline/shopify/*-shopify-main.png`.
- Shopify collection/card image: `pipeline/shopify/*-shopify-card.jpg`.

## Important Print Note

- Current source images are around 1024 px on shortest side. For high-quality large prints, request larger/vector source art.
- See `merch-delivery-manifest.csv` for max print size at 300 DPI per design.

## Manifest

- `pipeline/merch-delivery-manifest.csv` maps each set to the right delivery assets.
