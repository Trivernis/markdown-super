# markdown-super

Markdown-Super is a markkdown-parser using markdown it that allows including other markdown-documents and manage markdown-it plugins inside the document itself.

## Including other markdown documents

A document can be included by using

```markdown
[!include]: path/to/file
```

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
| markdown-it-prism    | prism
| markdown-it-toc-done-right | toc-done-right
| markdown-it-smartarrows | smartarrows
| markdown-it-plantuml | plantuml
| markdown-it-mathjax  | mathjax
| markdown-it-math     | math

For example you can declare the use of `markdown-it-emoji` the following:

```markdown
[!use]: emoji
```
