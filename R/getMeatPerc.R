getMeatPerc<-function(diet,current_diet,current_prot){
  prot <- ifelse(current_diet>0,current_prot/current_diet,0) #g/g

meatproducts=c(0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0); #Include eggs, milk and meat
meat=c(0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0); #Include just meat

totprotnow=sum(diet*prot);
meatprotnow=sum(diet*meat*prot);

c(meat=meatprotnow/totprotnow,meatprod=sum(diet*meatproducts*prot)/totprotnow)
}