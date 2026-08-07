# Appllama loader button experiments

A dependency-free gallery of 25 original loading button animations. The shared
button surface, page background, and every loader motion system are authored as
part of this Appllama experiment.

## Run locally

```bash
cd code
python3 -m http.server 4173
```

Then open <http://127.0.0.1:4173>.

The gallery uses one shared WebGL 2 context, mounts only within the visible
scroll range, and renders visible Canvas/WebGL surfaces at up to 3x device
pixel density. It still defaults to a resource-conscious 30fps. Each button
can be clicked to reset its local cycle. Use `?fps=15` for an extra-light
preview or `?fps=60` only when making a final capture.

## Deploy

The repository can keep research and production files separate. For static
hosting, leave the build command empty and publish the `code` directory. The
production URL is:

<https://loader-buttons.experiments.appllama.io/>

`robots.txt`, `sitemap.xml`, canonical metadata, social metadata, and JSON-LD
are already configured for that hostname.
