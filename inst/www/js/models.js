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
		if(!this.get('current_diet')) return this;
		if(!this.get('fpm')) return this;
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
		if(!model.get('current_diet')[0]) return this;
		if(!model.get('ader')) return this;
		if(!model.get('kcal_per_gram')) return this;
		if(!model.get('prot_per_gram')) return this;
		if(!model.get('fat_per_gram')) return this;
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
		this.getUserCountryIPinfo(); //should be only when data is ready
		//this.set('user_country',"Finland");
	},
	getUserCountryIPinfo:function(){
		var model=this;
		//http://stackoverflow.com/questions/3489460/how-to-get-visitors-location-i-e-country-using-javascript-geolocation 
		//country codes from http://geolite.maxmind.com/download/geoip/database/GeoLite2-Country-CSV.zip
		var req=$.get("http://ipinfo.io/geo", function (response) {
			//console.log(JSON.stringify(response, null, 4));
			model.set('user_country',countries[iso3166.indexOf(response.country)]);
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
		if(!this.model.get('fpm')) return this;
		this.$el.find(".xeditable").editable('destroy')
		this.$el.html(_.template($("#TableFPMatrix_template").html(),{
			fpm:this.model.get("fpm")
		}));
		var model=this.model;
		this.$el.find(".xeditable").editable({
			unsavedclass:null,
		    success: function(response, newValue) {
				var fpm = _.map(model.get('fpm'),function(x){return x.slice()});
				var name = $(this).data('name');
				var w = parseInt(name.replace('fpm_','').replace(/_.*/,''));
				var i = parseInt(name.replace(/fpm_.*_/,''));
				fpm[w][i]=newValue/1000.0
				model.set('fpm',fpm);
			}})
		return this;
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
		if(!this.model.get('kcal_per_gram')) return this;
		if(!this.model.get('prot_per_gram')) return this;
		if(!this.model.get('fat_per_gram')) return this;
		
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

		this.$el.find(".xeditable").editable('destroy')
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
		var model=this.model;
		this.$el.find(".xeditable").editable({
			unsavedclass:null,
		    success: function(response, newValue) {
				var name = $(this).data('name');
				var i = parseInt(name.replace(/grams_/,''));
				var current_diet = model.get('current_diet').slice();
				current_diet[i]=parseFloat(newValue);
				model.set('current_diet',current_diet);
			}})
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
		this.$el.find(".xeditable").editable('destroy');
		this.$el.html(_.template($("#TableConstraints_template").html(),{
			ader:this.model.get('ader'),
			user_prot_perc:this.model.get("user_prot_perc"),
			user_fat_perc:this.model.get("user_fat_perc"),
			user_vegmin:this.model.get("user_vegmin"),
			user_meatprodprotub:this.model.get("user_meatprodprotub"),
			user_meatprotub:this.model.get("user_meatprotub"),
		}));
		var model=this.model;
		this.$el.find(".xeditable").editable({
			unsavedclass:null,
		    success: function(response, newValue) {
				var name = $(this).data('name');
				if(name=='ader') model.set('ader',parseFloat(newValue));
				if(name=='user_prot_perc_0'){
					var user_prot_perc=model.get('user_prot_perc').slice()
					user_prot_perc[0]=parseFloat(newValue)/100.0
					model.set('user_prot_perc',user_prot_perc);
				}
				if(name=='user_prot_perc_1'){
					var user_prot_perc=model.get('user_prot_perc').slice()
					user_prot_perc[1]=parseFloat(newValue)/100.0
					model.set('user_prot_perc',user_prot_perc);
				}
				if(name=='user_fat_perc_0'){
					var user_fat_perc=model.get('user_fat_perc').slice()
					user_fat_perc[0]=parseFloat(newValue)/100.0
					model.set('user_fat_perc',user_fat_perc);
				}
				if(name=='user_fat_perc_1'){
					var user_fat_perc=model.get('user_fat_perc').slice()
					user_fat_perc[1]=parseFloat(newValue)/100.0
					model.set('user_fat_perc',user_fat_perc);
				}
				if(name=='user_vegmin') model.set('user_vegmin',parseFloat(newValue));
				if(name=='user_meatprotub') model.set('user_meatprotub',parseFloat(newValue)/100.0);
				if(name=='user_meatprodprotub') model.set('user_meatprodprotub',parseFloat(newValue)/100.0);
			}});
		return this;
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

var DraggableBarplotProducts = Backbone.View.extend({
	initialize: function(args){	
		this.height=args.height;
		this.main=args.main;
		this.legend_text=args.legend_text;
		this.seriesColors=args.seriesColors;
		this.yaxis_label=args.yaxis_label;
		this.listenTo(this.model,'change:'+this.height,this.render,this);
		this.create();
	},
	create:function(){
		if(!this.$el.is(":visible")) return this;
		
		var pn=product_names.slice(0);
		pn.splice(9,1);

        $.jqplot.config.enablePlugins = true;
 
		//data is array of arrays of each series
		var y=this.model.get(this.height);
		if(!Array.isArray(y[0])) y=[y];

		var opts = {
			stackSeries:true,
            animate: false,
            seriesDefaults:{
                renderer:$.jqplot.BarRenderer,
                pointLabels: { show: true }
            },
            axes: {
                xaxis: {
                    renderer: $.jqplot.CategoryAxisRenderer,
					tickRenderer:$.jqplot.CanvasAxisTickRenderer,
					tickOptions:{
						angle:-60,
					},		
                    ticks: pn
                }
            },
            highlighter: { show: true, tooltipContentEditor:tooltipContentEditor }
        };
		if(this.legend_text) opts["series"]=_.map(this.legend_text,function(x){return {
			label:x,				
			dragable:{
				color: undefined,
				constrainTo:'y'
			},
			isDragable: true
		}});
		if(this.seriesColors) opts["seriesColors"]=this.seriesColors;
		if(this.yaxis_label) opts["axes"]["yaxis"]={label:this.yaxis_label,labelRenderer: $.jqplot.CanvasAxisLabelRenderer};

        this.plot = $.jqplot(this.$el.attr('id'), y, opts);

		function tooltipContentEditor(str, seriesIndex, pointIndex, plot) {
			// display series_label, x-axis_tick, y-axis value
			return plot.series[seriesIndex]["label"] + ", " + plot.data[seriesIndex][pointIndex].toFixed(2);
		}
		
		var view=this;
		view.$el.on('jqplotDragStop',function(seriesIndex, pointIndex, pixelposition, data){
				view.model.set(view.height,_.map(view.plot.series[0].data,function(x){return x[1]}))
			});
		
		return this;
	},
	render:function(){
		if(!this.plot){
			this.create();
			return this;
		}
	    this.plot.series[0].data = _.map(this.model.get(this.height),function(x,i){return [i+1,x]});
        //this.plot.resetAxesScale();
        this.plot.replot();
		return this;
	}
});  

var InteractiveBarplotProducts = Backbone.View.extend({
	initialize: function(args){	
		this.height=args.height;
		this.main=args.main;
		this.legend_text=args.legend_text;
		this.seriesColors=args.seriesColors;
		this.listenTo(this.model,'change:'+this.height,this.render,this);
		this.create();
	},
	create:function(){
		var pn=product_names.slice(0);
		pn.splice(9,1);

        $.jqplot.config.enablePlugins = true;
 
		//data is array of arrays of each series
		var y=this.model.get(this.height);
		if(!Array.isArray(y[0])) y=[y];
		
		var opts={
			stackSeries:true,
            animate: false,
            seriesDefaults:{
                renderer:$.jqplot.BarRenderer,
                pointLabels: { show: true }
            },
            axes: {
                xaxis: {
                    renderer: $.jqplot.CategoryAxisRenderer,
					tickRenderer:$.jqplot.CanvasAxisTickRenderer,
					tickOptions:{
						angle:-60,
					},
                    ticks: pn
                }
            },
            highlighter: { show: true, tooltipContentEditor:tooltipContentEditor }
        };
		if(this.legend_text) opts["series"]=_.map(this.legend_text,function(x){return {label:x}});
		if(this.seriesColors) opts["seriesColors"]=this.seriesColors;
		
        this.plot = $.jqplot(this.$el.attr('id'), y, opts);		
		
		function tooltipContentEditor(str, seriesIndex, pointIndex, plot) {
			// display series_label, x-axis_tick, y-axis value
			return plot.series[seriesIndex]["label"] + ", " + plot.data[seriesIndex][pointIndex].toFixed(2);
		}
		
		return this;
	},
	render:function(){
		if(!this.plot){
			this.create();
			return this;
		}
		for(i=0;i<this.plot.series.length;i++){
			var y=this.model.get(this.height).slice(0);
			if(Array.isArray(y[0])) y=y[i]
			//console.log(y);
			this.plot.series[i].data = _.map(y,function(x,i){return [i+1,x]});
		}
        //this.plot.resetAxesScale();
        this.plot.replot();
		return this;
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
		this.listenTo(this.model,'change:fpm',this.actual_render,this);
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

var ListObjectives = Backbone.View.extend({
    initialize: function(args){
		this.tpl=_.template($("#ListObjectives_template").html());
		this.listenTo(this.model,'change:ader',this.render,this);
		this.listenTo(this.model,'change:user_prot_perc',this.render,this);
		this.listenTo(this.model,'change:user_fat_perc',this.render,this);
		this.listenTo(this.model,'change:user_vegmin',this.render,this);
		this.listenTo(this.model,'change:user_meatprodprotub',this.render,this);
		this.listenTo(this.model,'change:user_meatprotub',this.render,this);
		this.listenTo(this.model,'change:current_diet',this.render,this);
		this.render();
	},
	render:function(){
		if(!this.model.get('current_kcal')) return this;
		if(!this.model.get('current_prot')) return this;
		if(!this.model.get('current_fat')) return this;
		if(!this.model.get('current_diet')) return this;
		
		// Calculation of percentage energy intake
		kcal_total=sum(this.model.get('current_kcal'));
		kcal_perc=_.map(kcal,function(num){return num/kcal_total;});
		
		// Calculation of percentage protein intake
		prot_total=sum(this.model.get('current_prot'));
		prot_perc=_.map(prot,function(num){return num/prot_total;});
		
		//Calculation of total fat in grams
		fat_total=sum(this.model.get('current_fat'));
		fat_perc=_.map(fat,function(num){return num/fat_total;});

		this.$el.html(this.tpl({
			diet:this.model.get('current_diet'),	
			kcal_perc:kcal_perc,
			prot_perc:prot_perc,
			fat_perc:fat_perc,
			kcal_total:kcal_total,			
			kcal_prot:prot_total*4, //4 is conversion from grams to energy
			kcal_fat:fat_total*9, //9 is conversion from grams to energy
			ader:this.model.get('ader'),
			user_prot_perc:this.model.get("user_prot_perc"),
			user_fat_perc:this.model.get("user_fat_perc"),
			user_vegmin:this.model.get("user_vegmin"),
			user_meatprodprotub:this.model.get("user_meatprodprotub"),
			user_meatprotub:this.model.get("user_meatprotub"),
			footprints_totals:this.model.get('footprints_totals'),
		}));
	}
});