(function($){

	var privateFun = function(){
		//私有方法
	}

	var _prefix = (function(temp){
		var aPrefix = ["webkit","Moz","o","ms"],
			props = "";
		for(var i in aPrefix){
			props = aPrefix[i] + "Transition";
			if(temp.style[props] != undefined){
				return "-"+aPrefix[i].toLowerCase()+"-";
			}
		}
		return false;
	})(document.createElement(PageSwitch));



	var PageSwitch = (function(){
		function PageSwitch(element,options)
		{
			this.settings = $.extend(true,$.fn.PageSwitch.defaults,options||{});
			this.element = element;
			this.init();
		}
		PageSwitch.prototype = {

			//初始化插件
			//初始化DOM结构，布局，分页以及绑定事件
			init: function(){
				var me = this;//PageSwitch对象

				me.selectors = me.settings.selectors;
				me.sections = me.element.find(me.selectors.sections);
				me.section = me.sections.find(me.selectors.section);

				me.direction = me.settings.direction =="vertical" ? true:false;
				me.pagesCount = me.pagesCount();

				me.index = (me.settings.index>=0 && me.settings.index<me.pagesCount)? 
							me.settings.index:0;

				me.canScroll = true;//是否可以执行动画

				if(!me.direction){
					me._initLayout();
				}

				if(me.settings.pagination){
					me._initPaging();
				}

				me._initEvent();
			},
			//获取滑动页面的数量
			pagesCount:function(){
				return this.section.length;//?
			},
			//获取滑动的宽度或者高度
			switchLength: function(){
				return this.direction ? this.element.height():this.element.width();
			},
			//
			prev: function(){
				var me = this;
				if(me.index > 0)
					me.index--;
				else if(me.settings.loop)
				{
					me.index = me.pagesCount-1;
				}
				me._scrollPage();
			},
			//
			next: function(){
				var me = this;
				if(me.index < me.pagesCount)
					me.index++;
				else if(me.settings.loop)
				{
					me.index = 0;
				}
				me._scrollPage();
			},
			//主要针对横屏情况进行页面布局
			_initLayout:function(){
				var me = this;
				var width = (me.pagesCount * 100)+"%",
					cellWidth = (100/me.pagesCount).foFix(2)+"%";
				me.sections.width(width);
				me.section.width(cellWidth).css("float","left");
			},
			//实现分页的dom结构及css样式
			_initPaging: function(){
				var me = this,
					pagesClass = me.selectors.page.substring(1);
				me.activeClass = me.selectors.active.substring(1);
				var pageHtml = "<ul class = "+pagesClass+">";
				for(var i=0;i<me.pagesCount;i++)
				{
					pageHtml += "<li></li>";
				}
				pageHtml+="</ul>";
				me.element.append(pageHtml);

				var pages = me.element.find(me.selectors.page);
				me.pageItem = pages.find("li");
				me.pageItem.eq(me.index).addClass(me.activeClass);

				if(me.direction){
					pages.addClass("vertical");
				}else{
					pages.addClass("horizontal");
				}
			},
			//初始化插件事件
			_initEvent:function(){
				//直接绑定不会生效,用on方法
				//分页点击事件
				var me = this;
				me.element.on("click",me.selectors.page+" li",function(){
					me.index = $(this).index();//this是分页元素li
					me._scrollPage();
				});

				//滚轮事件
				me.element.on("mousewheel DOMMouseScroll",function(event){
					if(me.canScroll){
						var delta = event.originalEvent.wheelDelta || -event.originalEvent.detail;
						if(delta > 0 &&(me.index && !me.settings.loop || me.settings.loop)){
							me.prev();
						}else if(delta<0 && (me.index<me.pagesCount-1 && !me.settings.loop || me.settings.loop)){
							me.next();
						}
					}
				});

				//键盘事件
				if(me.settings.keyboard){
					$(window).on("keydown",function(event){
						if(me.canScroll)
						{
							var keycode = event.keyCode;
							if(keycode == 37 || keycode == 38)
								me.prev();
							else if(keycode == 39 || keycode == 40)
								me.next();
						}
					});
				}

				//调整窗口大小事件
				// $(window).resize(function(){
				// 	var currentLength = me.switchLength(),
				// 		offset = me.settings.direction ? 
				// 					me.section.eq(me.index).offset().top:
				// 					me.section.eq(me.index).offset().left;
				// 	if(Math.abs(offset)>currentLength/2 && me.index < (me.pagesCount-1)){
				// 		me.index++;
				// 	}
				// 	if(me.index){
				// 		me._scrollpage();
				// 	}
				// });

				//过渡动画结束事件transition
				me.sections.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend",
							function(){
								if(me.settings.callback && $.type(me.settings.callback) == "function")
									me.settings.callback();
								me.canScroll=true;
							});
			},

			_scrollPage: function(){
				var me = this,
					dest = me.section.eq(me.index).position();
				if(!dest) return;

				me.canScroll = false;
				if(_prefix){
					//支持transition属性
					me.sections.css(_prefix + "transition","all "+me.settings.duration+"ms "+me.settings.easing);
					var translate = me.direction ? "translateY(-"+dest.top+"px)" : "translateX(-"+dest.left+"px)";
					me.sections.css(_prefix+"transform",translate);
				}else{
					var animateCss = me.direction ? {top :-dest.top}:{left:-dest.left};
					me.sections.animate(animateCss,me.settings.duration,function(){
						if(me.settings.callback && $.type(me.settings.callback) == "function")
							me.settings.callback();
						me.canScroll = true;
					});
				}

				if(me.settings.pagination){
					me.pageItem.eq(me.index).addClass(me.activeClass).siblings("li").removeClass(me.activeClass);
				}
			}
		}
		return PageSwitch;
	})();

	//PageSwitch是一个方法
	$.fn.PageSwitch = function(options){
		//this 是$()获取到的jquery对象
		return this.each(function(){
			var me = $(this),
				instance = me.data("PageSwitch");
			if(!instance){
				instance = new PageSwitch(me,options);
				me.data("PageSwitch",instance);
			}
			if($.type(options)==="string")
				return instance[options]();
		});
	};

	$.fn.PageSwitch.defaults = {
		selectors:{
			sections:".sections",
			section:".section",
			page:".pages",
			active:".active"
		},
		index:0,
		easing:"ease",
		duration:500,
		loop:false,
		pagination:true,
		keyboard:true,
		direction:"vertical",//horizontal
		callback:""
	};

	$(function(){
		$('[data-PageSwitch]').PageSwitch();
	});


})(jQuery);