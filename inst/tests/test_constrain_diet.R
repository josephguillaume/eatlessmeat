## TODO: why does the starting point change between scenarios?
## TODO: why set the starting point as if directly cuts meat?

library(eatlessmeat)
library(testthat)

# Before waste
# current_diet <- c(282.33333333333, 295.00000000000, 23.33333333333, 100.66666666667, 466.00000000000, 210.66666666667, 1038.66666666667, 30.66666666667, 11.66666666667, 634.66666666667, 187.00000000000, 0.66666666667, 40.66666666667, 88.66666666667)[-10]
# current_kcal <- c(173.0000000, 879.00000000, 33.33333333, 72.66666667, 147.66666667, 552.66666667, 535.00000000, 256.66666667, 37.66666667, 1212.66666667, 127.33333333, 4.00000000, 39.00000000, 309.00000000)[-10]
# current_prot <- c(1.1666666667, 28.1333333333, 2.6666666667, 10.4000000000, 3.3666666667, 26.6000000000, 28.7000000000, 0.1666666667, 1.6666666667, 28.8666666667, 2.9333333333, 0.0333333333, 2.6333333333, 0.0000000000)[-10]
# current_fat <- c(0, 4.166666666667, 2.333333333333, 3, 0.866666666667, 48.700000000000, 36.033333333333, 29.033333333333, 2.300000000000, 31.866666666667, 0.200000000000, 0.100000000000, 2.066666666667, 0.000000000000)[-10]


#test_that("Data loaded correctly")
# after waste
test_that("Data for Finland is loaded correctly",{
  # Comparing to manual data from Excel
  current_diet <- c(207.601631577772, 216.915518236515, 21.606457556577, 81.529933333333, 339.714002764192, 180.016917529141, 961.796024947039, 29.215347592894, 11.114534410340, 0.000000000000, 148.500006350872, 0.635116252019, 29.646000241224, 64.638000525948)[-10]
  current_kcal <- c(127.2080835759900000, 646.3347136606660000, 30.8663679379666000, 58.8527333333333000, 107.6490008759210000, 472.2595716191700000, 495.4052054043640000, 244.5197570274830000, 35.8840682390982000, 0.0000000000000000, 101.1176513833030000, 3.8106975121166200, 28.4310002313380000, 225.2610018329090000)[-10]
  current_prot <- c(0.85785798172633, 20.68663247362920, 2.46930943503733, 8.42296000000000, 2.45430001997020, 22.72998420700230, 26.57594279458920, 0.15877906300486, 1.58779063004859, 0.00000000000000, 2.32941186432741, 0.03175581260097, 1.91970001562026, 0.00000000000000)[-10]
  current_fat <- c(0.00000000000000, 3.06377850616546, 2.16064575565766, 2.42970000000000, 0.63180000514084, 41.61467033387260, 33.36654374094190, 27.65931277544650, 2.19115106946706, 0.00000000000000, 0.15882353620414, 0.09526743780292, 1.50660001225894, 0.00000000000000)[-10]  
  ader <- 2550
  
  names(current_diet) <- names(current_kcal) <- 
    names(current_prot) <- names(current_fat) <- product_names[-10]
  
  expect_that(origdiet["Finland",][-10],equals(current_diet))
  expect_that(origkcd["Finland",][-10],equals(current_kcal))
  expect_that(origprot["Finland",][-10],equals(current_prot))
  expect_that(origfat["Finland",][-10],equals(current_fat))
  expect_that(kcaltgtvector[["Finland"]],equals(ader))
})

#########

## Finland
product_names <- product_names[-10]
ader <- kcaltgtvector[["Finland"]]
current_diet =origdiet["Finland",][-10]
current_kcal = origkcd["Finland",][-10]
current_prot = origprot["Finland",][-10]
current_fat = origfat["Finland",][-10]

test_that("Objective value from quadprog matches expected",{
  sol <- constrain_diet(current_diet,current_kcal,current_prot,current_fat,ader,
                        meatprodprotub=1,meatprotub=1,return.state="sol")
  H=diag(ifelse(current_diet>0,2/(current_diet^2),1e5)); #the Hessian matrix for optimization'
  val <- as.numeric(0.5*t(sol$solution) %*% H %*% (sol$solution))
  expect_that(sol$value,equals(val))
})

test_that("H matrix is constructed correctly for Scenario 1",{
matlab.hdiag <- c(4.64053946984557e-05, 4.25058543907873e-05, 0.00428413214215051, 
                  0.000300881732593284, 1.73301809992557e-05, 6.17167934537611e-05, 
                  2.16204157025249e-06, 0.00234319202289543, 0.0161900222708465, 
                  9.06936856299354e-05, 4.95819432044673, 0.00227560971954242, 
                  0.000478689794019862)
expect_that(as.numeric(ifelse(current_diet>0,2/(current_diet^2),1e5)),equals(matlab.hdiag))
})

test_that("Matlab solution is correctly evaluated",{
  ## Solution from matlab
  matlab.sol <- c(207.601631567542, 321.498704915591, 21.293443059369, 81.5299332225771, 
                  388.981912399601, 111.430757169339, 761.657660567004, 20.1264079158185, 
                  11.0180876269166, 160.587597073453, 0.635114712456346, 29.5173744375622, 
                  63.7499999983239)-current_diet
  matlab.val <- 0.545852934651744
  H=diag(ifelse(current_diet>0,2/(current_diet^2),1e5)); #the Hessian matrix for optimization
  val <- as.numeric(0.5*t(matlab.sol) %*% H %*% (matlab.sol))
  expect_that(val,equals(matlab.val))
  
  ## Previously causing problems
  x=c(207.601631577772, 319.448568180481, 21.2920942126376,   81.5299333333333, 388.982842439382, 111.556218412865, 760.450360319579,   20.1714314577376, 11.0171575606177, 160.358829920782, 0.635116252019437,   29.512901765928, 65.5260010518958)
  H=diag(ifelse(current_diet>0,2/(current_diet^2),1e5)); #the Hessian matrix for optimization'
  val <- as.numeric(0.5*t(x-current_diet) %*% H %*% (x-current_diet))
  #x=[207.601631577772, 319.448568180481, 21.2920942126376,   81.5299333333333, 388.982842439382, 111.556218412865, 760.450360319579,   20.1714314577376, 11.0171575606177, 160.358829920782, 0.635116252019437,   29.512901765928, 65.5260010518958]
  #0.5*(x-a)*H*(x-a)'
  matlab.val <- 0.535622474674313
  expect_that(val,equals(matlab.val))
})

matlab.sol.s1 <- c(207.60163156754200, 321.49870491559100, 21.29344305936900, 81.52993322257710, 388.98191239960100, 111.43075716933900, 761.65766056700400, 20.12640791581850, 11.01808762691660, 160.58759707345300, 0.63511471245635, 29.51737443756220, 63.74999999832390)
## From erl498784suppdata3.xlsx, sheet Scenario 2, B58:O58
matlab.sol.s2 <- c(207.58955713899000,321.52343447124400, 21.29334536334840, 81.52230794558400, 389.00396458721700, 111.42375118932600, 761.61538877342700, 20.12537874497150, 11.01805567540690, 0.00000000000000, 160.58920422247800, 0.63494063613704, 29.51729577304310, 63.74462388131260)[-10]
matlab.sol.s3 <- c(207.6016159, 421.8242222, 20.1149977, 81.52993319, 399.2518582, 24.26433039, 390.8969301, 19.93719703, 23.89864831, 0, 281.2511452, 0.634931076, 29.64599994, 62.84676812)[-10]
matlab.sol.s4 <- c(205.236451082272000, 466.412036536269000, 17.811319089416400, 81.529933214762500, 400.302877499481000, 20.477198400378500, 177.033587890056000, 19.499870027561300, 24.208898999880700, 0.000000000000000, 282.459853301363000, 0.634716234296862, 29.646000010679700, 60.975906743461300)[-10]

test_that("Matlab reaches same solution for Scenario 1",{
  sol <- constrain_diet(current_diet,current_kcal,current_prot,current_fat,ader,
                        meatprodprotub=1,meatprotub=1)
  expect_that(as.numeric(sol),equals(matlab.sol.s1))
})

test_that("current_diet is updated as expected for Scenario 2-4",{
  matlab.a <- c(207.589557172089, 321.523433429186, 21.2933453614775, 81.5223080061617, 
    389.00396469469, 84.1241937503332, 761.615386659943, 20.1253787539578, 
    23.0825593637962, 270.462362647146, 0.634941406339631, 29.5172958043989, 
    63.7446239006879)
  sol <- constrain_diet(current_diet,current_kcal,current_prot,current_fat,ader,
                        meatprodprotub=0.25,meatprotub=0.083,return.state="current_diet",start=matlab.sol.s2
  )
  expect_that(as.numeric(sol),equals(matlab.a))
})

test_that("Meat constraints are correctly calculated for Scenario 2-4",{
  matlab.b <- c(9.17910257992932, 22.6958974200707, 3.81886254337608, 38.6811374566239, 
                12.0865240584866, -15.9356981072993, 0.00762532717169506, -6.89400210825748, 
                0.00537609931210881, 0.0120744056825401, 0.000174845679805746, 
                0.128704436825284)
  b <- constrain_diet(current_diet,current_kcal,current_prot,current_fat,ader,
                        meatprodprotub=0.25,meatprotub=0.083,return.state="b",start=matlab.sol.s2
  )
  expect_that(as.numeric(b),equals(-matlab.b))
})

test_that("Matlab reaches same solution for Scenario 2",{
  sol <- constrain_diet(current_diet,current_kcal,current_prot,current_fat,ader,
                        meatprodprotub=0.5,meatprotub=0.167,start=matlab.sol.s1
  )
  expect_that(as.numeric(sol),equals(matlab.sol.s2,tolerance=1e-4))
})


test_that("Matlab reaches same solution for Scenario 3",{
  sol <- constrain_diet(current_diet,current_kcal,current_prot,current_fat,ader,
                        meatprodprotub=0.25,meatprotub=0.083,start=matlab.sol.s2
  )
  expect_that(as.numeric(sol),equals(matlab.sol.s3,tolerance=1e-6))
})


test_that("Matlab reaches same solution for Scenario 4",{
  sol <- constrain_diet(current_diet,current_kcal,current_prot,current_fat,ader,
                      meatprodprotub=0.125,meatprotub=0.0417,start=matlab.sol.s3
                      )
  expect_that(as.numeric(sol),equals(matlab.sol.s4,tolerance=1e-7))
})


test_that("meat percentagess of solutions match",{
  sol1 <- constrain_diet(current_diet,current_kcal,current_prot,current_fat,ader,
                         meatprodprotub=1,meatprotub=1)
  sol2 <- constrain_diet(current_diet,current_kcal,current_prot,current_fat,ader,
                         meatprodprotub=0.5,meatprotub=0.167,start=matlab.sol.s1
  )
  sol3 <- constrain_diet(current_diet,current_kcal,current_prot,current_fat,ader,
                         meatprodprotub=0.25,meatprotub=0.083,start=matlab.sol.s2
  )
  sol4 <- constrain_diet(current_diet,current_kcal,current_prot,current_fat,ader,
                         meatprodprotub=0.125,meatprotub=0.0417,start=matlab.sol.s3
  )
  
  expect_that(getMeatPerc(sol1,current_diet,current_prot),equals(getMeatPerc(matlab.sol.s1,current_diet,current_prot)))
  expect_that(getMeatPerc(sol2,current_diet,current_prot),equals(getMeatPerc(matlab.sol.s2,current_diet,current_prot),tolerance=1e-4))
  expect_that(getMeatPerc(sol3,current_diet,current_prot),equals(getMeatPerc(matlab.sol.s3,current_diet,current_prot),tolerance=1e-7))
  expect_that(getMeatPerc(sol4,current_diet,current_prot),equals(getMeatPerc(matlab.sol.s4,current_diet,current_prot)))
})
