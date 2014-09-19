## Convert matlab csvs to Rdata for inclusion in package

wd <- setwd("..")
product_names <- c("beverages","cereals","eggs",  "fish",  "fruits&vegs",  "meat",  "milk",  "oil",	"oilseeds",	"other",	"roots",	"spices",	"stimulants",	"sugar")

save(product_names,file="product_names.Rdata")

dir(pattern=".csv")

countries <- read.csv("countries.csv",stringsAsFactors=FALSE)[-1,1]
save(countries,file="countries.Rdata")
file.remove("countries.csv")

# origdiet <- read.csv("origdiet.csv",header=FALSE)
# names(origdiet) <- product_names
# origdiet <- cbind(countries=countries,origdiet)
# save(origdiet,file="origdiet.Rdata")

origdiet <- as.matrix(read.csv("origdiet.csv",header=FALSE))
colnames(origdiet) <- product_names
rownames(origdiet) <- countries
save(origdiet,file="origdiet.Rdata")
file.remove("origdiet.csv")

origprot <- as.matrix(read.csv("origprot.csv",header=FALSE))
colnames(origprot) <- product_names
rownames(origprot) <- countries
save(origprot,file="origprot.Rdata")
file.remove("origprot.csv")

origfat <- as.matrix(read.csv("origfat.csv",header=FALSE))
colnames(origfat) <- product_names
rownames(origfat) <- countries
save(origfat,file="origfat.Rdata")
file.remove("origfat.csv")

origkcd <- as.matrix(read.csv("origkcd.csv",header=FALSE))
colnames(origkcd) <- product_names
rownames(origkcd) <- countries
save(origkcd,file="origkcd.Rdata")
file.remove("origkcd.csv")

bluefootprintlgmatrix <- as.matrix(read.csv("bluefootprintlgmatrix.csv",header=FALSE))
colnames(bluefootprintlgmatrix) <- product_names
rownames(bluefootprintlgmatrix) <- countries
save(bluefootprintlgmatrix,file="bluefootprintlgmatrix.Rdata")
file.remove("bluefootprintlgmatrix.csv")

greenfootprintlgmatrix <- as.matrix(read.csv("greenfootprintlgmatrix.csv",header=FALSE))
colnames(greenfootprintlgmatrix) <- product_names
rownames(greenfootprintlgmatrix) <- countries
save(greenfootprintlgmatrix,file="greenfootprintlgmatrix.Rdata")
file.remove("greenfootprintlgmatrix.csv")

##

population <- read.csv("population.csv",header=FALSE)[,1]
names(population) <- countries
save(population,file="population.Rdata")
file.remove("population.csv")

kcaltgtvector <- read.csv("kcaltgtvector.csv",header=FALSE)[,1]
names(kcaltgtvector) <- countries
save(kcaltgtvector,file="kcaltgtvector.Rdata")
file.remove("kcaltgtvector.csv")

setwd(wd)