// all templates
// MY TAPE
app_prms.tmpl.tapecard = Template7.compile(
	'{{#each tape}}'+
		'<div class="card lid-tape-card">'+
		  '<div class="card-header">'+
		    '<div class="lid-tape-time">{{this.time}}</div>'+
		    '{{#if this.author}}'+
		    '<div class="lid-tape-avatar"><img src="{{this.author.photo}}" width="34" height="34"/></div>'+
		    '<div class="lid-tape-name">{{this.author.name}}</div>'+
		    '<div class="lid-tape-author"><a href="/users/{{this.author.id}}/">#{{this.author.alias}}</a></div>'+
		    '{{/if}}'+
		  '</div>'+
		'{{#if this.imgs}}'+
		  '<div class="swiper-container">'+
			  '<div class="swiper-pagination"></div>'+
			  '<div class="swiper-wrapper">'+
			'{{#each this.imgs}}'+
			  	'<div style="background-image:url({{this}}){{#if ../../vw}};height:{{../../vw}}vw{{/if}}" class="swiper-slide"></div>'+
			'{{/each}}'+
			  '</div>'+
		  '</div>'+
		'{{/if}}'+
		'{{#if this.ext}}'+
		  '<div class="card-footer card-buttons">'+
			  '<a href="#" class="link"><i class="lid-icon-like"></i>{{#if this.ext.likes}} {{this.ext.likes}}{{/if}}</a>'+
			  '<a href="/post/{{this.id}}/" class="link"><i class="lid-icon-comment"></i>{{#if this.ext.comments}} {{this.ext.comments}}{{/if}}</a>'+
			  '<a href="#" class="link"><i class="lid-icon-repost"></i>{{#if this.ext.reposts}} {{this.ext.reposts}}{{/if}}</a>'+
		  '</div>'+
		'{{/if}}'+
		  '<div class="card-content card-content-padding">'+
		    '<p>{{this.text}}{{#if this.tags}}{{#each this.tags}} <a href="/tags/{{this}}/">#{{this}}</a>{{/each}}{{/if}}</p>'+
		  '</div>'+
		'</div>'+
	'{{/each}}'
);

// USER TAPE - small
app_prms.tmpl.tapesmallcard = Template7.compile(
	'{{#each this}}'+
	'<a href="/post/{{this.id}}/" class="tape-small-card" style="background-image:url(\'{{this.img}}\');"></a>'+
	'{{/each}}'
);

// POST COMMENTS
app_prms.tmpl.postcomments = Template7.compile(
    '{{#each comments}}'+
	    '<div class="item-content">'+
		    '<div class="item-media"><a href="/users/{{this.author.id}}/" class="img-lifeisdance img-small-avatar"><img src="{{this.author.photo}}"></a></div>'+
		    '<div class="item-inner">'+
			    '<div class="item-text"><a href="/users/{{this.author.id}}/">{{this.author.name}}</a> {{this.text}}</div>'+
			    '<div class="item-subtitle">{{this.time}} <a href="#">Answer</a></div>'+
		    '</div>'+
		    '<div class="item-media-end"><a href="#"><i class="lid-icon-like"></i></a></div>'+
		'</div>'+
    '{{/each}}'
);

// TOUR CATS
app_prms.tmpl.tour_cats = Template7.compile(
	'<div class="list media-list chevron-center">'+
	'<ul>'+
	'{{#each this}}'+
		'<li><a href="/hit/{{this.id}}/{{this.final}}/" class="item-link item-content">'+
			'<div class="item-inner">'+
			'<div class="item-title-row">'+
			'<div class="item-title">{{this.title}}</div>'+
			'<div class="item-after">{{this.time}}</div>'+
			'</div>'+
			'<div class="item-subtitle">{{this.final_type}}</div>'+
			'</div>'+
		'</a></li>'+
	'{{/each}}'+
	'</ul>'+
	'</div>'
);