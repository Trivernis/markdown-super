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
  --bundle     Bundle all images and script in one html

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
or
[!use]: # (plugin1, plugin2, plugin3)
```

The plugin names are listed in the following table. Basically it is just the package name with the markdown-it removed. See [Plugins](#plugins)
 
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

## Stylesheets

You can include your own stylesheet. It is applied after the default style. The stylesheets are applied in the order they are declared.

```markdown
[!stylesheet]: path/to/style.css
```

## Variables

Variables are prefixed with `$`.
You can define and use variables like this:

Defining:
```
$varname = value
$fruit = apple
```

Using:
```
I'm eating an $fruit.
```

There are system variables that are prefixed with `$$`.
Currently you can use

variable | value           | example value     
---------|-----------------|--------------
$now     | current datetime| 31.07.2019 21:03:47
$date    | current date    | 31.07.2019
$time    | current time    | 21:03:47


## Configuration file

You can also define plugins, stylesheets and other stuff by using a `mdconf.json` file in the same directory as the main markdown file. Example config:

```json5
{ // everything is optional
  "extends": "full", // extend from predefined configurations
  "format": "A4",
  "plugins": [
    "emoji",
    "footnote",
    "markdown-it-multimd-table"
  ],
  "stylesheets": [
    "customstyle.css"
  ]
}
```

### Predefined configurations

config | type
-------|-----
full   | includes all plugins

## Plugins

Plugin Name      |  Markdown-it plugin
-----------------|---------------------
emoji            | markdown-it-emoji
footnote         | markdown-it-footnote
anchor           | markdown-it-anchor
mark             | markdown-it-mark
sub              | markdown-it-sub
attrs            | markdown-it-attrs
abbr             | markdown-it-abbr
checkbox         | markdown-it-checkbox
imsize           | markdown-it-imsize
highlightjs      | markdown-it-highlightjs
smartarrows      | markdown-it-smartarrows
plantuml         | markdown-it-plantuml
math             | markdown-it-math
div              | markdown-it-div
kbd              | markdown-it-kbd
video            | markdown-it-video
underline        | markdown-it-underline
multimd-table    | markdown-it-multimd-table
toc-done-right   | markdown-it-toc-done-right
center-text      | markdown-it-center-text
header-sections  | markdown-it-header-sections
task-checkbox    | markdown-it-task-checkbox
implicit-figures | markdown-it-implicit-figures
