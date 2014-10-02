//zip+map are used for elementwise operations
//http://stackoverflow.com/questions/15108250/mapping-two-or-more-arrays-into-one-with-underscore-js

sum=function(vector){ return _.reduce(vector, function(memo, num){ return memo + num; }, 0)}

prod=function(vec1,vec2){return _.map(_.zip(vec1,vec2),
			function(pieces){return pieces[0]*pieces[1]})}

add=function(vec1,vec2){return _.map(_.zip(vec1,vec2),
			function(pieces){return pieces[0]+pieces[1]})}
			
			

// Global variables
var product_names = ["beverages","cereals","eggs","fish","fruits&vegs","meat","milk","oil","oilseeds","other","roots","spices","stimulants","sugar"];

// Diet or CountryDiet instead?
var LocalData = Backbone.Model.extend({
	defaults:{
		footprints_totals:[NaN,NaN],
		current_diet:[NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN],
		// set by constrainDiet
		user_constrained_diet:[NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN],
		user_prot_perc:[0.1,0.15],
		user_fat_perc:[0.15,0.3],
		user_vegmin:400,
		user_meatprodprotub:1,
		user_meatprotub:1,
		ader:NaN,
		jalava_scens:null
	},
	initialize:function(args){
		this.gc=args.gc;
		this.listenTo(this.gc,'change:user_country',this.getCountryData,this);
		//this.listenTo(this.gc,'change:ready',this.getCountryData,this);
		this.getCountryData();
		this.on('change:fpm',this.calcFP);
		this.on('change:current_diet',this.calcFP);
		this.on('change:current_diet',this.calcNutrition);
		this.calcFP();
		this.jalavaScenarios();
		this.on('change:prot_per_gram',this.jalavaScenarios);
		this.on('change:fat_per_gram',this.jalavaScenarios);
		this.on('change:kcal_per_gram',this.jalavaScenarios);
		this.on('change:fpm',this.jalavaScenarios);
		this.on('change:current_diet',this.jalavaScenarios);
		this.on('change:ader',this.jalavaScenarios);
		this.on('change:user_prot_perc',this.jalavaScenarios);
		this.on('change:user_fat_perc',this.jalavaScenarios);
		this.on('change:user_vegmin',this.jalavaScenarios);
	},
	getCountryData:function(){
		var model=this;
		//var req=ocpu.rpc('get_country_data',{code:model.get('user_country')},function(data){
		//	model.set('current_diet',data.current_diet);
		//	model.set('bluefootprintlg',data.bluefootprintlg);
		//	model.set('greenfootprintlg',data.greenfootprintlg);
		//});
		// would be obsolete
		//if (!this.gc.countries) return this;
		if(!this.gc.get('user_country')) return this;
		//console.log(this.gc.get('user_country'));
		idx=countries.indexOf(this.gc.get('user_country'));
		var x=origdiet[idx].slice(0);
		x.splice(9,1);
		this.set('current_diet',x);
		var x=origprot[idx].slice(0);
		x.splice(9,1);
		this.set('current_prot',x);
		var x=origkcd[idx].slice(0);
		x.splice(9,1);
		this.set('current_kcal',x);
		var x=origfat[idx].slice(0);
		x.splice(9,1);
		this.set('current_fat',x);
		var x=bluefootprintlgmatrix[idx].slice(0);
		x.splice(9,1);
		var y=greenfootprintlgmatrix[idx].slice(0);
		y.splice(9,1);
		this.set('fpm',[x,y]);
		this.set('ader',kcaltgtvector[idx]);
		this.calc_per_gram();
		return this;
	},
	calc_per_gram:function(){
		this.set('kcal_per_gram',_.map(_.zip(this.get('current_kcal'),this.get('current_diet')),
			function(pieces){if(pieces[1]>0){return pieces[0]/pieces[1]} else {return 0}}));
		this.set('prot_per_gram',_.map(_.zip(this.get('current_prot'),this.get('current_diet')),
			function(pieces){if(pieces[1]>0){return pieces[0]/pieces[1]} else {return 0}}));
		this.set('fat_per_gram',_.map(_.zip(this.get('current_fat'),this.get('current_diet')),
			function(pieces){if(pieces[1]>0){return pieces[0]/pieces[1]} else {return 0}}));
	},
	calcNutrition:function(){
		if(!this.get('kcal_per_gram')) return this;
		if(!this.get('prot_per_gram')) return this;
		if(!this.get('fat_per_gram')) return this;
		this.set('current_prot',prod(this.get('current_diet'),this.get('prot_per_gram')));
		this.set('current_fat',prod(this.get('current_diet'),this.get('fat_per_gram')));
		this.set('current_kcal',prod(this.get('current_diet'),this.get('kcal_per_gram')));
		return this;
	},
	calcFP:function(){
		var x=[prod(this.get('current_diet'),this.get('fpm')[0])].concat(
			[prod(this.get('current_diet'),this.get('fpm')[1])]);
		//x=x.concat([add(x[0],x[1])]); //Sum
		this.set('footprints',x);
		this.set('footprints_totals',_.map(this.get('footprints'),function(x){return sum(x)}));
		//var model=this;
		// var req=ocpu.rpc('diet_footprint',{
				// diet:model.get('current_diet'),
				// bluefplg:model.get('fpm')[0],
				// greenfplg:model.get('fpm')[1]
			// },function(data){
				// model.set('footprints',data);
			// }
		// );
	},
	calcMeatPerc:function(){
		var model=this;
		var req=ocpu.rpc('getMeatPerc',{
			diet:model.get('current_diet'),
			current_diet:model.get('current_diet'),
			current_prot:model.get('current_prot')
		},function(data){
			//console.log(data);
			model.set('prot_perc_meat',data[0]);
			model.set('prot_perc_meat_prod',data[1]);
		});
		return this;
	},
	constrainDiet:function(){
		var model=this;
		var req=ocpu.rpc('constrain_diet',{
			current_diet:model.get('current_diet'),
			current_kcal:model.get('current_kcal'),
			current_prot:model.get('current_prot'),
			current_fat:model.get('current_fat'),
			ader:model.get('ader'),
			start:model.get('current_diet'),
			prot_perc:model.get("user_prot_perc"),
			fat_perc:model.get("user_fat_perc"),
			vegmin:model.get("user_vegmin"),
			meatprodprotub:model.get("user_meatprodprotub"),
			meatprotub:model.get("user_meatprotub")
		},function(data){
			model.set('user_constrained_diet',data);
		});
		return this;
	},
	jalavaScenarios:function(){
		var model=this;
		if(!model.get('current_diet')) return this;
		var req=ocpu.rpc('jalava_scenarios',{
			current_diet:model.get('current_diet'),
			ader:model.get('ader'),
			//start:model.get('current_diet'),
			prot_perc:model.get("user_prot_perc"),
			fat_perc:model.get("user_fat_perc"),
			vegmin:model.get("user_vegmin"),
			//TODO: allow overriding meat constraints?
			k:model.get('kcal_per_gram'),
			prot:model.get('prot_per_gram'),
			fat:model.get('fat_per_gram'),
			'use.names':false,
			transpose:true
		},function(data){
			var results=[model.get('current_diet')].concat(data);
			model.set('jalava_scens',results);
			model.set('jalava_scens_prot',_.map(results,function(x){ return prod(x,model.get('prot_per_gram'))}));
			model.set('jalava_scens_fat',_.map(results,function(x){ return prod(x,model.get('fat_per_gram'))}));
			model.set('jalava_scens_kcal',_.map(results,function(x){ return prod(x,model.get('kcal_per_gram'))}));
			model.set('jalava_scens_fpb',_.map(results,function(x){ return prod(x,model.get('fpm')[0])}));
			model.set('jalava_scens_fpg',_.map(results,function(x){ return prod(x,model.get('fpm')[1])}));
			});
		return this;		
	}
});


var GlobalContext = Backbone.Model.extend({
	initialize:function(){
		//this.loadCountries();
		//this.getAllData();
		//this.getUserCountryIPinfo(); //should be only when it is ready
		this.set('user_country',"Finland");
		//this.set('user_country',"Switzerland");
	},
	getUserCountryIPinfo:function(){
		var model=this;
		//http://stackoverflow.com/questions/3489460/how-to-get-visitors-location-i-e-country-using-javascript-geolocation 
		var req=$.get("http://ipinfo.io", function (response) {
			console.log(JSON.stringify(response, null, 4));
			model.set('user_country',response.country);
		}, "jsonp");
		//TODO: what should default be?
		req.fail(function(){model.set('user_country',"Finland")});
	},
   loadCountries:function(){
		var model=this;
		$.getJSON("http://josephguillaume.ocpu.io/eatlessmeat/data/countries/json",function(data){
			model.countries=data;
		});
	},
	getAllData:function(){
		var model=this;
		$.when(
			$.getJSON("http://josephguillaume.ocpu.io/eatlessmeat/data/origdiet/json",function(data){
				model.origdiet=data;
			}),
			$.getJSON("http://josephguillaume.ocpu.io/eatlessmeat/data/origprot/json",function(data){
				model.origprot=data;
			}),
			$.getJSON("http://josephguillaume.ocpu.io/eatlessmeat/data/origkcd/json",function(data){
				model.origkcd=data;
			}),
			$.getJSON("http://josephguillaume.ocpu.io/eatlessmeat/data/origfat/json",function(data){
				model.origfat=data;
			}),			
			$.getJSON("http://josephguillaume.ocpu.io/eatlessmeat/data/greenfootprintlgmatrix/json",function(data){
				model.greenfootprintlgmatrix=data;
			}),		
			$.getJSON("http://josephguillaume.ocpu.io/eatlessmeat/data/bluefootprintlgmatrix/json",function(data){
				model.bluefootprintlgmatrix=data;
			}),
			$.getJSON("http://josephguillaume.ocpu.io/eatlessmeat/data/kcaltgtvector/json",function(data){
				model.kcaltgtvector=data;
			})
		).done(function(){
			model.set('ready',true);
		});
	}
});

var Footprint = Backbone.View.extend({
    initialize: function(args){
		this.listenTo(this.model,'change:footprints_totals',this.render,this);
		this.render();
	},
	render:function(){
		this.$el.find("span.blue").html(this.model.get('footprints_totals')[0].toFixed(2));
		this.$el.find("span.green").html(this.model.get('footprints_totals')[1].toFixed(2));
	}
});


var TableFPMatrix = Backbone.View.extend({
    initialize: function(args){
		this.listenTo(this.model,'change:fpm',this.render,this);
		this.render();
	},
	render:function(){
		this.$el.html(_.template($("#TableFPMatrix_template").html(),{
			fpm:this.model.get("fpm")
		}));
	}
});

var TableDiet = Backbone.View.extend({
    initialize: function(args){
		this.diet=args.diet;
		this.listenTo(this.model,'change:'+this.diet,this.render,this);
		this.listenTo(this.model,'change:kcal_per_gram',this.render,this);
		this.listenTo(this.model,'change:prot_per_gram',this.render,this);
		this.listenTo(this.model,'change:fat_per_gram',this.render,this);
		this.listenTo(this.model,'change:user_meatprotub',this.render,this);
		this.listenTo(this.model,'change:user_prot_perc',this.render,this);
		this.listenTo(this.model,'change:user_fat_perc',this.render,this);
		this.render();
	},
	render:function(){
		if(!this.model.get('current_kcal')) return this;
		if(!this.model.get('current_prot')) return this;
		if(!this.model.get('current_fat')) return this;
		if(!this.model.get('current_diet')) return this;
		
		// Calculation of percentage energy intake
		kcal=prod(this.model.get(this.diet),this.model.get('kcal_per_gram'));
		kcal_total=sum(kcal);
		kcal_perc=_.map(kcal,function(num){return num/kcal_total;});
		
		// Calculation of percentage protein intake
		prot=prod(this.model.get(this.diet),this.model.get('prot_per_gram'));
		prot_total=sum(prot);
		prot_perc=_.map(prot,function(num){return num/prot_total;});
		
		//Calculation of total fat in grams
		fat=prod(this.model.get(this.diet),this.model.get('fat_per_gram'));
		fat_total=sum(fat);
		fat_perc=_.map(fat,function(num){return num/fat_total;});

		this.$el.html(_.template($("#TableDiet_template").html(),{
			diet:this.model.get(this.diet),	
			kcal_perc:kcal_perc,
			prot_perc:prot_perc,
			fat_perc:fat_perc,
			ader:this.model.get("ader"),
			user_meatprotub:this.model.get("user_meatprotub"),
			user_prot_perc:this.model.get("user_prot_perc"),
			user_fat_perc:this.model.get("user_fat_perc"),
			kcal_total:kcal_total,			
			kcal_prot:prot_total*4, //4 is conversion from grams to energy
			kcal_fat:fat_total*9 //9 is conversion from grams to energy
		}));
		return this;
	}
});


var TableConstraints = Backbone.View.extend({
    initialize: function(args){
		this.listenTo(this.model,'change:ader',this.render,this);
		this.listenTo(this.model,'change:user_prot_perc',this.render,this);
		this.listenTo(this.model,'change:user_fat_perc',this.render,this);
		this.listenTo(this.model,'change:user_vegmin',this.render,this);
		this.listenTo(this.model,'change:user_meatprodprotub',this.render,this);
		this.listenTo(this.model,'change:user_meatprotub',this.render,this);
		this.render();
	},
	render:function(){
		this.$el.html(_.template($("#TableConstraints_template").html(),{
			ader:this.model.get('ader'),
			user_prot_perc:this.model.get("user_prot_perc"),
			user_fat_perc:this.model.get("user_fat_perc"),
			user_vegmin:this.model.get("user_vegmin"),
			user_meatprodprotub:this.model.get("user_meatprodprotub"),
			user_meatprotub:this.model.get("user_meatprotub"),
		}));
	}
});


var BarplotProducts = Backbone.View.extend({
	initialize: function(args){
		this.dirty=true;
		this.height=args.height;
		this.main=args.main;
		this.legend_text=args.legend_text;
		this.listenTo(this.model,'change:'+this.height,this.actual_render,this);
		this.actual_render();
	},
	render:function(){
		if(!this.model.get(this.height)) return this;	
		if(!this.$el.is(":visible"))return this;
		if(!this.dirty) return this; //don't rerun unless plot actually needs to change
		
		var pn=product_names.slice(0);
		pn.splice(9,1);
		
		var opts={					
					height:this.model.get(this.height),
					'names.arg':pn,
					las:2,
					beside:true,
					main:this.main //TODO: make optional?
				};
		if(this.legend_text) opts['legend.text']=this.legend_text;
		
		var req=this.$el.rplot("barplot",opts);
		var view=this;
		req.done(function(){
			view.dirty=false;
		});
		
		return this;
	},
	actual_render:function(){
		this.dirty=true;
		this.render();
	}
});

var Barplot = Backbone.View.extend({
	initialize: function(args){
		this.height=args.height;
		this.main=args.main;
		this.listenTo(this.model,'change:'+this.height,this.render,this);
		this.render();
	},
	render:function(){
		if(!this.model.get(this.height)) return this;
		if(this.$el.height()<=150 || this.$el.width()<=150) return this;
		if(!this.$el.is(":visible")) return this;
		this.$el.rplot("barplot",{					
					height:this.model.get(this.height),
					las:2,
					beside:true,
					main:this.main //TODO: make optional?
					//TODO: legend.text,main
				})
		return this;
	}
});

var BarplotFootprint = Backbone.View.extend({
	initialize: function(args){
		this.dirty=true;
		this.listenTo(this.model,'change:jalava_scens',this.actual_render,this);
		this.actual_render();
	},
	render:function(){
		var model=this.model;
		var results=model.get('jalava_scens');
		if(!results) return this;
		if(this.$el.height()<=150 || this.$el.width()<=150) return this;
		if(!this.$el.is(":visible")) return this;
		if(!this.dirty) return this; //don't rerun unless plot actually needs to change
		
		var height= [_.map(results,function(x){ return sum(prod(x,model.get('fpm')[0]))})].
			concat([_.map(results,function(x){ return sum(prod(x,model.get('fpm')[1]))})]);
		height=height.concat([add(height[0],height[1])]);
		// Calculate water saved compared to current instead
		height = _.map(height,function(x){return _.map(x,function(xi){return x[0]-xi})});

		var req=this.$el.rplot("barplot",{					
					height:height,
					las:2,
					beside:true,
					'names.arg':['Current','Scenario 1','Scenario 2','Scenario 3','Scenario 4'],
					main:"Water footprint saved (l/cap/day)",
					'legend.text':['Blue','Green','Total']
				});
		var view=this;
		req.done(function(){
			view.dirty=false;
		});
		
		return this;
	},
	actual_render:function(){
		this.dirty=true;
		this.render();
	}
});

var SelectCountry = Backbone.View.extend({
	initialize: function(args){
		this.$el.html(_.template($("#SelectCountry_template").html(),{
			countries:countries
		}));
		var view=this;
		this.$el.find("select").on('change',function(){view.model.set('user_country',view.$el.find("select").val())});
		this.listenTo(this.model,'change:user_country',this.render,this);
		this.render();
	},
	render:function(){
		this.$el.find("select").val(this.model.get('user_country'));
	}
});