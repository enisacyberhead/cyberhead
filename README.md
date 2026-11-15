# CYBERHEAD archive

A static, one-page archive of the ENISA **CYBERHEAD** cybersecurity higher education database (189 programmes), kept online after the original website closed.

- **Programmes list** (`#/programmes`): search, filter by type, delivery, cost, language and country.
- **Programme page** (`#/programme/<id>`): description, ECTS pie chart, established year, certification and a working link to the programme's own website.
- No build step, no frameworks, no external requests (fonts are self-hosted). It also works when you open `index.html` directly from disk.

## Publish on GitHub Pages

1. Create a new repository on GitHub and upload everything in this folder (or `git push` it).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

## Update the data

Edit `data/programmes.csv`, then regenerate the data file:

```
python3 scripts/build_data.py
```

This rewrites `data/programmes.js`, which is what the page loads.

## Structure

```
index.html            page shell
assets/css/style.css  styles
assets/js/app.js      routing, filters, list, detail page
assets/img/           logos and programme image
assets/fonts/         Roboto (latin, latin-ext, greek, cyrillic)
data/programmes.csv   source data
data/programmes.js    generated from the CSV
scripts/build_data.py CSV -> JS converter
```

## Notes

- The banner at the top of the page says this is an archived copy not run by ENISA. Remove the `.archive-note` element in `index.html` if you don't want it.
- Programme data, the CYBERHEAD and ENISA logos and the programme photo belong to their respective owners (ENISA and the universities). Check you are allowed to republish them.
