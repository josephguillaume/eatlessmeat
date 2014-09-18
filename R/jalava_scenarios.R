jalava_scenarios <- function(..., #passed to constrain_diet
                             ## Max protein % from animal products
                             meatprodprotub=c(1,0.5,0.25,0.125),
                             ## Max protein % from meat
                             meatprotub=c(1,0.167,0.083,0.0417),
                             use.names=TRUE,
                             transpose=FALSE
){
  
  sol1 <- constrain_diet(...,
                         meatprodprotub=meatprodprotub[1],meatprotub=meatprotub[1])
  sol2 <- constrain_diet(...,
                         meatprodprotub=meatprodprotub[2],meatprotub=meatprotub[2],start=sol1
  )
  sol3 <- constrain_diet(...,
                         meatprodprotub=meatprodprotub[3],meatprotub=meatprotub[3],start=sol2
  )
  sol4 <- constrain_diet(...,
                         meatprodprotub=meatprodprotub[4],meatprotub=meatprotub[4],start=sol3
  )
  
  x <- cbind(sol1,sol2,sol3,sol4)
  
  if(!use.names){
    colnames(x) <- NULL
    rownames(x) <- NULL
  }
  if(transpose) x <- t(x)
  
  return(x)
  
}