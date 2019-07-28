# markdown-super

Markdown-Super is a markkdown-parser using markdown it that allows including other markdown-documents and manage markdown-it plugins inside the document itself.

## Commandline

```
usage: index.js [-h] [-w] [--pdf] file

Positional arguments:
  file         The file to render

Optional arguments:
  -h, --help   Show this help message and exit.
  -w, --watch  Watch files for changes
  --pdf        Output as pdf


```

## Including other markdown documents

A document can be included by using

```markdown
[!include]: path/to/file
```

Included documents can also use include.
If there is a circular include, the include resulting in an endless loop is ignored.

## Managing markdown-it plugins

The usage of a markdown-it plugin inside a document can be decleared by using

```markdown
[!use]: plugin1, plugin2, plugin3
```

The plugin names are listed in the following table. Basically it is just the package name with the markdown-it removed:

| module               | import name |
|----------------------|-------------|
| markdown-it-footnote | footnote
| markdown-it-anchor   | anchor
| markdown-it-mark     | mark
| markdown-it-sub      | sub
| markdown-it-attrs    | attrs
| markdown-it-abbr     | abbr
| markdown-it-checkbox | checkbox
| markdown-it-imsize   | imsize
| markdown-it-highlightjs | highlightjs
| markdown-it-toc-done-right | toc-done-right
| markdown-it-smartarrows | smartarrows
| markdown-it-plantuml | plantuml
| markdown-it-mathjax  | mathjax
| markdown-it-math     | math
| markdown-it-div      | div

For example you can declare the use of `markdown-it-emoji` the following:

```markdown
[!use]: emoji
```

## Pages

You can manage the pages that are exported to the pdf. A new page can be started with: 

```markdown
[!newpage]
```

Note that this automatically includes `markdown-it-div` in your project.
If you want to declare one page specifically, you need to declare the use of  `markdown-it-div` (`[!use]: div`). Then you pages can be created like this:

```markdown
::: page
Your page's content.
Warning: be careful not to put too much content in this environment
because it will be rendered as only ONE page in the pdf output.
:::
```
