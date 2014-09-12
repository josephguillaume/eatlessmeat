constrain_rd <- function(current_diet,current_kcal,current_prot,current_fat,
                          ader,
                          ## bounds on percentage prot and fat, WHO 2003. 
                          prot_perc=c(0.1,0.15),
                          fat_perc=c(0.15,0.3),
                          #Minimum of fruits and vegetables IN GRAMS!
                          vegmin=400
                          ){
  
  prot <- ifelse(current_diet>0,current_prot/current_diet,0) #g/g
  k <- ifelse(current_diet>0,current_kcal/current_diet,0) #kcal/g
  fat <- ifelse(current_diet>0,current_fat/current_diet,0) #g/g
  
  ## Groups
  vegs=c(0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0); #Include f&v and oilseeds
  fruitsandvegs=c(0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0);
  meatproducts=c(0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0); #Include eggs, milk and meat
  eggs=c(0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  milk=c(0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0);
  meat=c(0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0); #Include just meat
  fish=c(0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0); #Include just fish
  oilseeds=c(0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0);
  roots=c(0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0);
  sugar=c(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1);
  beverages=c(1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  spices=c(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0);
  stimulants=c(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0);
  cereals=c(0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  oil=c(0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0);
  
  
  ## Constraints
  kcaltgt=ader
  ## No meat limit, WHO
  ## proportions are given on energy and converted to g
  ## kcal / (kcal/g)
  ## kcal/g by Atwater 1900
  ## could use 4.7 for prot, Livesey&Elia 1988
  # lower and upper bounds in grams
  protlb=prot_perc[1]*kcaltgt/4; 
  protub=prot_perc[2]*kcaltgt/4;
  fatlb=fat_perc[1]*kcaltgt/9;
  fatub=fat_perc[2]*kcaltgt/9;
  
  veglb=vegmin;
  
  # constraints common to scenarios
  fishub=current_diet[4]; # cannot increase fish consumption
  sugarub=0.1*kcaltgt/4; # cannot increase free sugar intake, used in scen 2+
  beveragesub=current_diet[1]; # cannot increase beverages (alcohol) intake, used in scen 2+
  spicesub=current_diet[11];
  stimulantsub=current_diet[12];
  
  ## Ax>=b
  A=rbind(-prot, prot=prot, -fat, fat=fat, vegs=vegs, -fish, -sugar, -beverages, -spices, -stimulants)
  b=rbind(-(protub-sum(current_diet*prot)),
          (protlb-sum(current_diet*prot)),
          -(fatub-sum(current_diet*fat)),
          (fatlb-sum(current_diet*fat)),
          (veglb-sum(current_diet*vegs)),
          -(fishub-sum(current_diet*fish)),
          -(sugarub-sum(current_diet*sugar)),
          -(beveragesub-sum(current_diet*beverages)),
          -(spicesub-sum(current_diet*spices)),
          -(stimulantsub-sum(current_diet*stimulants))
  )
  
  Aeq=k; #equality constraint: kcal/g * grams foodstuff sum...
  beq=kcaltgt-sum(current_diet*k); #...equals target, note we start at all zeros
  
  
  H=diag(ifelse(current_diet>0,2/(current_diet^2),1e5)); #the Hessian matrix for optimization
  
  f=matrix(rep(0,13),ncol=1); #there are no first order terms
  lbb=matrix(-current_diet,ncol=1); #lower bound is "real world zero", we just simplify by optimizing
  lbA=diag(13)
  
  ## optim_diet
  
  sol <- solve.QP(Dmat=H,dvec=f,Amat=t(rbind(Aeq,A,lbA)),bvec=rbind(beq,b,lbb),meq=1)
  current_diet+sol$solution
}
