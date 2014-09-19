## Export data to js to be loaded in browser

library(eatlessmeat)
library(RJSONIO)

sink("inst/www/js/data.js")

cat("var countries =",toJSON(countries),";\n")

names(kcaltgtvector)=NULL
cat("var kcaltgtvector =",toJSON(kcaltgtvector),";\n")

colnames(origdiet)=NULL
rownames(origdiet)=NULL
cat("var origdiet =",toJSON(origdiet),";\n")

colnames(origfat)=NULL
rownames(origfat)=NULL
cat("var origfat =",toJSON(origfat),";\n")

colnames(origprot)=NULL
rownames(origprot)=NULL
cat("var origprot =",toJSON(origprot),";\n")

colnames(origkcd)=NULL
rownames(origkcd)=NULL
cat("var origkcd =",toJSON(origkcd),";\n")

colnames(greenfootprintlgmatrix)=NULL
rownames(greenfootprintlgmatrix)=NULL
cat("var greenfootprintlgmatrix =",toJSON(greenfootprintlgmatrix),";\n")

colnames(bluefootprintlgmatrix)=NULL
rownames(bluefootprintlgmatrix)=NULL
cat("var bluefootprintlgmatrix =",toJSON(bluefootprintlgmatrix),";\n")

sink()