# Simona Barbone — Portfolio di Interior Design

Sito statico: nessuna build, nessuna dipendenza. Si apre `index.html` e funziona.

## Avvio in locale

I book vengono caricati via `fetch`/`<img>` con percorsi relativi, quindi serve un
server locale (aprire il file con `file://` blocca alcune risorse):

```bash
python3 -m http.server 5188
```

Poi apri http://localhost:5188

## Struttura

```
index.html              home: hero con la pila di copertine, i quattro book, profilo, contatti
book.html               lettore: ?b=<slug>#p<numero>   es. book.html?b=aurum#p12
assets/css/base.css     colori guida (petrolio #003B49), tipografia, linee di quota
assets/css/themes.css   un tema per book: colori e caratteri presi dalla copertina
assets/css/home.css     home
assets/css/viewer.css   lettore
assets/js/data.js       dati dei book (titoli, testi, pagine, palette)
assets/js/home.js       pila di copertine che si sfoglia, schede, rivelazione allo scroll
assets/js/flipbook.js   rotazione del foglio, trascinamento, indice, zoom
assets/books/<slug>/    p001…pNNN.webp (1600px) · thumb/ (420px) · zoom/ (2600px) · cover.webp
assets/img/             monogramma SB, ritratto, logo IDEAcademy
Media/                  originali: PDF dei book, logo, foto
```

## Rigenerare le pagine dai PDF

Le immagini in `assets/books/` sono generate dai PDF in `Media/books/`.
Se un book cambia, servono PyMuPDF e Pillow:

```bash
python3 -m venv .venv && .venv/bin/pip install pymupdf pillow
```

Gli script usati sono due passaggi sullo stesso schema: pagine di lettura a 1600px
(più miniature a 420px) e pagine per lo zoom a 2600px, ritagliando il bleed con il
`trimbox` del PDF — è quello che serve, per esempio, ad AURUM, che ha le crocine.

## Aggiungere un book

1. Metti il PDF in `Media/books/`.
2. Genera le immagini in `assets/books/<slug>/`.
3. Aggiungi la voce in `assets/js/data.js` (slug, titolo, pagine, palette, testo).
4. Aggiungi il tema in `assets/css/themes.css` con lo stesso slug.

## Comandi del lettore

| Azione | Come |
| --- | --- |
| Pagina avanti / indietro | clic sulle metà del foglio, `→` `←`, trascinamento |
| Vai a una pagina | indice miniature (`T`) o la linea di quota in basso |
| Ingrandisci | clic al centro della pagina o `Z`, poi muovi il mouse |
| Schermo intero | `F` |
| Prima / ultima pagina | `Home` / `End` |
