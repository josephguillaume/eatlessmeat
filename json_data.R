## Export data to js to be loaded in browser

library(eatlessmeat)
rm(countries)
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


iso3166=read.csv("../GeoLite2-Country-Locations-en.csv",stringsAsFactors=FALSE)
corrections=c(
  "Bolivia (Plurinational State of)"="Bolivia",
  "Brunei Darussalam"="Brunei",
  "Côte d'Ivoire" ="Ivory Coast",
  "Democratic People's Republic of Korea"="North Korea",
  "Democratic Republic of the Congo"="Republic of the Congo",
  "Iran (Islamic Republic of)"="Iran",
  "Jordan"="Hashemite Kingdom of Jordan",
  "Lao People's Democratic Republic"="Laos",
  "Lithuania"="Republic of Lithuania", 
  "Myanmar"="Myanmar [Burma]", 
  "Netherlands Antilles"="CuraÃ§ao", #also Bonaire and Sint Maarten 
  "Occupied Palestinian Territory"="Palestine", 
  "Russian Federation"="Russia", 
  #"Sao Tome and Principe"=""SÃ£o TomÃ© and PrÃ?ncipe""
  "Syrian Arab Republic"="Syria", 
  "The former Yugoslav Republic of Macedonia"="Macedonia", 
  "Timor-Leste"="East Timor",
  "United Republic of Tanzania"="Tanzania", 
  "United States of America"="United States", 
  "Venezuela (Bolivarian Republic of)"="Venezuela", 
  "Viet Nam"="Vietnam"
)
countries[match(names(corrections),countries)]<-corrections
iso3166$country_name[131]="Sao Tome and Principe"
w=match(countries,iso3166$country_name)

#countries[is.na(w)]
stopifnot(all(!is.na(w)))

cat("var iso3166 =",toJSON(iso3166$country_iso_code[w]),";\n")

sink()