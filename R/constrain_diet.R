constrain_diet <- function(current_diet,current_kcal,current_prot,current_fat,
                          ader,
                          ## bounds on percentage prot and fat, WHO 2003. 
                          prot_perc=c(0.1,0.15),
                          fat_perc=c(0.15,0.3),
                          ## Minimum of fruits and vegetables IN GRAMS!
                          vegmin=400,
                          ## Max protein % from animal products
                          meatprodprotub=1,
                          ## Max protein % from meat
                          meatprotub=1,
                          start=current_diet,
                          prot,k,fat,
                          return.state=NULL
                          ){
  
  if(missing(prot)) prot <- ifelse(current_diet>0,current_prot/current_diet,0) #g/g
  if(missing(k)) k <- ifelse(current_diet>0,current_kcal/current_diet,0) #kcal/g
  if(missing(fat)) fat <- ifelse(current_diet>0,current_fat/current_diet,0) #g/g
  

  
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

  ## Matlab code changes start value
  current_diet=start
    
  ## Meat products less than % of total protein
  meatproductslimit=(meatproducts-meatprodprotub)*prot;
  meatproductsconst=-sum((meatproducts-meatprodprotub)*prot*current_diet);


  ## Meat less than meatprotub% of total protein
  ## sum(diet*meat*prot) <= meatprotub*sum(diet*prot)
  ## change=new-old == new=old+change
  ## sum((old+change)*meat*prot) <= meatprotub*sum((old+change)*prot)
  ## sum((old*meat*prot+change*meat*prot) <= meatprotub*sum(old*prot+change*prot)
  ## sum(old*meat*prot)+sum(change*meat*prot) <= meatprotub*sum(old*prot)+meatprotub*sum(change*prot)
  ## sum(change*meat*prot)-meatprotub*sum(change*prot) <= meatprotub*sum(old*prot)-sum(old*meat*prot)
  ## sum(change*meat*prot-meatprotub*change*prot) <= sum(meatprotub*old*prot-old*meat*prot)
  ## sum(change*prot*(meat-meatprod)) <= sum((meatprotub-meat)*old*prot)
  meatlimit=(meat-meatprotub)*prot; 
  meatconst=-sum((meat-meatprotub)*prot*current_diet);
  
  ##
  ## sum((new-base)*prot*(meat-meatprod)) <= sum((meatprotub-meat)*old*prot)

  
  # We expect to move some allocation from meat to oilseeds and
  # roots. We do not know yet how much exactly, but we set the
  # starting point as if the limit would directly cut the meat
  # allocation
  totprotnow=sum(current_diet*prot);
  meatprotnow=sum(current_diet*meat*prot);
  if(meatprotnow/totprotnow > meatprotub){
    #oilseeds
    current_diet[9]=current_diet[9]+(meatprotnow-meatprotub*totprotnow)/(4*prot[9]);
    #roots
    current_diet[10]=current_diet[10]+(meatprotnow-meatprotub*totprotnow)/(4*prot[10]);
    #meat
    current_diet[6]=current_diet[6]-(meatprotnow-meatprotub*totprotnow)/(2*prot[6]);
  }
  

  Aeq=k; #equality constraint: kcal/g * grams foodstuff sum...
  beq=kcaltgt-sum(current_diet*k); #...equals target, note we start at all zeros


  ## Ax>=b
  A=rbind(-prot, prot=prot, -fat, fat=fat, vegs=vegs, 
          meatproductslimits=-meatproductslimit,
          -fish,meatlimit=-meatlimit,
          -sugar, -beverages, -spices, -stimulants)
  b=rbind(prot=-(protub-sum(current_diet*prot)),
          prot=(protlb-sum(current_diet*prot)),
          fat=-(fatub-sum(current_diet*fat)),
          fat=(fatlb-sum(current_diet*fat)),
          veg=(veglb-sum(current_diet*vegs)),
          meatprod=-meatproductsconst,
          fish=-(fishub-sum(current_diet*fish)),
          meat=-meatconst,
          sugar=-(sugarub-sum(current_diet*sugar)),
          beverage=-(beveragesub-sum(current_diet*beverages)),
          spice=-(spicesub-sum(current_diet*spices)),
          stim=-(stimulantsub-sum(current_diet*stimulants))
  )
  
  
  H=diag(ifelse(current_diet>0,2/(current_diet^2),1e5)); #the Hessian matrix for optimization
  
  f=matrix(rep(0,13),ncol=1); #there are no first order terms
  lbb=matrix(-current_diet,ncol=1); #lower bound is "real world zero", we just simplify by optimizing
  lbA=diag(13)

  
  sol <- solve.QP(Dmat=H,dvec=f,Amat=t(rbind(Aeq,A,lbA)),bvec=rbind(beq,b,lbb),meq=1)
  if(!is.null(return.state)) return(get(return.state))
  current_diet+sol$solution
}
