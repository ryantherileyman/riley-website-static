
var rileyman = rileyman || { };
rileyman.blog = rileyman.blog || { };

rileyman.blog.Locale = 'en';
rileyman.blog.setLocale = function(value) {
	rileyman.blog.Locale = value;
};
rileyman.blog.getResource = function(key) {
	var LocalizedResources = {
		'en': {
			'dateFormat': 'M d, yy',
			
			'blogPost.authorLine': 'Posted by [POSTER_USERNAME] on [DATE] at [TIME]',
			
			'blogPost.commentCount.none': 'No Comments',
			'blogPost.commentCount.single': '1 Comment',
			'blogPost.commentCount.multiple': '[COUNT] Comments',
			'blogPost.commentText.placeholder': 'Share your thoughts',
			'blogPost.commenterUsername.label': 'Your Name:',
			'blogPost.postCommentButton.label': 'Post Comment',
			'blogPost.commentInfoLine.noUsername': 'Posted on [DATE] at [TIME]',
			'blogPost.commentInfoLine.withUsername': 'Posted by [COMMENTER_USERNAME] on [DATE] at [TIME]',
			
			'button.more': 'MORE',
			
			'summary.title': 'Recent Posts',
			'summary.blogPost.dateFormat': 'M d',
			
			'error.request': 'OMG! An error occurred attempting to retrieve the blog posts!',
			'error.saveNewComment.request': 'OMG! An error occurred attempting to post your crazy comment!',
			'error.saveNewComment.POST_NOT_ACCEPTING_COMMENTS': 'This post is not currently accepting any new comments.',
			'error.saveNewComment.COMMENT_EMPTY': 'The comment was empty.  Please actually TYPE SOMETHING!',
			'error.saveNewComment.COMMENT_TOO_LONG': 'Wow, you actually typed too much.  Simmer down now!',
			'error.saveNewComment.SPAM_DETECTION': 'A comment was just recently posted to this blog.  To prevent the possibility of spam, only one comment may be posted every two seconds.',
		},
	};
	
	var result = LocalizedResources[rileyman.blog.Locale][key];
	return result;
};

rileyman.blog.FormatUtils = rileyman.blog.FormatUtils || { };

rileyman.blog.FormatUtils.formatDate = function(dateValue, resourceKey) {
	var dateStr = jQuery.datepicker.formatDate(rileyman.blog.getResource(resourceKey), dateValue);
	return dateStr;
};
	
rileyman.blog.FormatUtils.formatTime = function(dateValue) {
	var timeStr = rileyman.blog.FormatUtils.pad2chars(dateValue.getHours()) + ':' + rileyman.blog.FormatUtils.pad2chars(dateValue.getMinutes());
	return timeStr;
};

rileyman.blog.FormatUtils.pad2chars = function(num) {
	var paddedStr;
	if ( num < 10 ) {
		paddedStr = '0' + num;
	} else {
		paddedStr = num;
	}
	return paddedStr;
};

rileyman.blog.ControllerInitParams = function() {
	
	var jqPostAnchor = null;
	var jqSummaryAnchor = null;
	var blogCode = 'RILEY_WEBSITE';
	var initialLoadCount = 20;
	var subsequentLoadCount = 20;
	
	this.getJqPostAnchor = function() {
		return jqPostAnchor;
	};
	this.setJqPostAnchor = function(value) {
		jqPostAnchor = value;
	};
	
	this.getJqSummaryAnchor = function() {
		return jqSummaryAnchor;
	};
	this.setJqSummaryAnchor = function(value) {
		jqSummaryAnchor = value;
	};
	
	this.getBlogCode = function() {
		return blogCode;
	};
	this.setBlogCode = function(value) {
		this.blogCode = value;
	};
	
	this.getInitialLoadCount = function() {
		return initialLoadCount;
	};
	this.setInitialLoadCount = function(value) {
		this.initialLoadCount = value;
	};
	
	this.getSubsequentLoadCount = function() {
		return subsequentLoadCount;
	};
	this.setSubsequentLoadCount = function(value) {
		this.subsequentLoadCount = value;
	};
	
};

rileyman.blog.Controller = function(initParams) {
	
	var URL = 'portals/servlets/blogPost';
	var Operation = {
		LOAD_INITIAL_BLOG_POSTS: 'LOAD_INITIAL_BLOG_POSTS',
		LOAD_BY_NAV_SEARCH: 'LOAD_BY_NAV_SEARCH',
	};
	
	var jqPostAnchor = initParams.getJqPostAnchor();
	var jqSummaryAnchor = initParams.getJqSummaryAnchor();
	var blogCode = initParams.getBlogCode();
	var initialLoadCount = initParams.getInitialLoadCount();
	var subsequentLoadCount = initParams.getSubsequentLoadCount();
	
	var totalPostCount = 0;
	var shownPostCount = 0;
	
	this.initialize = function() {
		requestInitialBlogPosts();
	};
	
	function requestInitialBlogPosts() {
		jQuery.ajax({
			url: URL,
			data: {
				operation: Operation.LOAD_INITIAL_BLOG_POSTS,
				blogCode: blogCode,
				count: initialLoadCount,
			},
			dataType: 'xml',
			success: processInitialBlogPostListResult,
			error: processRequestError,
		});
	}
	
	function processInitialBlogPostListResult(data, textStatus, jqXHR) {
		jqInitialBlogPostListResult = jQuery(data).children('initialBlogPostListResult');
		
		totalPostCount = Number(jqInitialBlogPostListResult.attr('blogPostCount'));
		
		jqPostAnchor.empty();
		renderBlogPostList(jqInitialBlogPostListResult.children('blogPost'));
		
		jqSummaryAnchor.empty();
		jqSummaryAnchor.append('<h1>' + rileyman.blog.getResource('summary.title') + '</h1>');
		renderBlogPostSummary(jqInitialBlogPostListResult.children('blogPost'));
	}
	
	function requestNextBlogPostPage() {
		jQuery.ajax({
			url: URL,
			data: {
				operation: Operation.LOAD_BY_NAV_SEARCH,
				blogCode: blogCode,
				startPos: shownPostCount + 1,
				count: subsequentLoadCount,
			},
			dataType: 'xml',
			success: processBlogPostList,
			error: processRequestError,
		});
	}
	
	function processBlogPostList(data, textStatus, jqXHR) {
		jqBlogPostList = jQuery(data).children('blogPostList');
		renderBlogPostList(jqBlogPostList.children('blogPost'));
	}
	
	function processRequestError(jqXHR, textStatus, errorThrown) {
		alert(rileyman.blog.getResource('error.request'));
	}
	
	function renderBlogPostList(jqBlogPostList) {
		var currBlogPostElement;
		for ( var index = 0; index < jqBlogPostList.length; index++ ) {
			currBlogPostElement = rileyman.blog.createBlogPostArticleFromXml(jqBlogPostList[index]);
			currBlogPostElement.style.display = 'none';
			jqPostAnchor.append(currBlogPostElement);
			jQuery(currBlogPostElement).slideDown('slow');
			shownPostCount++;
		}
		
		if ( shownPostCount < totalPostCount ) {
			var morePostsButton = createMorePostsButton();
			jqPostAnchor.append(morePostsButton);
			jQuery(morePostsButton).click(morePostsButtonClick);
		}
	}
	
	function createMorePostsButton() {
		var result = document.createElement('div');
		result.className = 'moreBlogPostsButton';
		result.innerHTML = rileyman.blog.getResource('button.more');
		return result;
	}
	
	function morePostsButtonClick() {
		jQuery(this).remove();
		requestNextBlogPostPage();
	}
	
	function renderBlogPostSummary(jqBlogPostList) {
		var currBlogPostElement;
		for ( var index = 0; index < jqBlogPostList.length; index++ ) {
			currBlogPostElement = rileyman.blog.createBlogPostSummaryFromXml(jqBlogPostList[index]);
			jqSummaryAnchor.append(currBlogPostElement);
		}
	}
	
};

rileyman.blog.createBlogPostArticleFromXml = function(xmlBlogPost) {
	var result = document.createElement('article');
	result.className = 'blog-entry';
	result.appendChild(createHeaderElement());
	result.appendChild(createContentDiv());
	result.appendChild(createAuthorDiv());
	result.appendChild(createCommentSectionDiv());
	initCommentController();
	
	function createHeaderElement() {
		var headerElement = document.createElement('h1');
		headerElement.innerHTML = jQuery(xmlBlogPost).find('postTitle').text();
		return headerElement;
	}
	
	function createContentDiv() {
		var divElement = document.createElement('div');
		divElement.innerHTML = jQuery(xmlBlogPost).find('postText').text();
		return divElement;
	}
	
	function createAuthorDiv() {
		var postDateMillis = Number(jQuery(xmlBlogPost).find('postDate').text());
		
		var authorElement = document.createElement('div');
		authorElement.className = 'author';
		authorElement.innerHTML = rileyman.blog.getResource('blogPost.authorLine')
			.replace('[POSTER_USERNAME]', jQuery(xmlBlogPost).find('posterUsername').text())
			.replace('[DATE]', rileyman.blog.FormatUtils.formatDate(new Date(postDateMillis), 'dateFormat'))
			.replace('[TIME]', rileyman.blog.FormatUtils.formatTime(new Date(postDateMillis)))
			;
		return authorElement;
	}
	
	function createCommentSectionDiv() {
		var commentSectionElement = document.createElement('div');
		commentSectionElement.className = 'commentSection';
		
		commentSectionElement.appendChild(createCommentCountDiv());
		commentSectionElement.appendChild(createPostCommentAreaDiv());
		
		var commentDivArray = createCommentDivArray();
		for ( var index in commentDivArray ) {
			commentSectionElement.appendChild(commentDivArray[index]);
		}
		
		return commentSectionElement;
	}
	
	function createCommentCountDiv() {
		var commentCount = jQuery(xmlBlogPost).find('commentList').attr('count');
		
		var text;
		if ( commentCount == 0 ) {
			text = rileyman.blog.getResource('blogPost.commentCount.none');
		} else if ( commentCount == 1 ) {
			text = rileyman.blog.getResource('blogPost.commentCount.single');
		} else {
			text = rileyman.blog.getResource('blogPost.commentCount.multiple')
				.replace('[COUNT]', commentCount);
		}
		
		var commentCountElement = document.createElement('div');
		commentCountElement.className = 'commentCount';
		commentCountElement.innerHTML = text;
		return commentCountElement;
	}
	
	function createPostCommentAreaDiv() {
		var textareaElement = document.createElement('textarea');
		textareaElement.className = 'commentText';
		textareaElement.placeholder = rileyman.blog.getResource('blogPost.commentText.placeholder');
		textareaElement.tabindex = -1;
		
		var postCommentAreaElement = document.createElement('div');
		postCommentAreaElement.className = 'postCommentArea';
		
		postCommentAreaElement.appendChild(textareaElement);
		postCommentAreaElement.appendChild(createCommentFormLineDiv());
		
		return postCommentAreaElement;
	}
	
	function createCommentFormLineDiv() {
		var formLabelDiv = document.createElement('div');
		formLabelDiv.className = 'commentFormLabel';
		formLabelDiv.innerHTML = rileyman.blog.getResource('blogPost.commenterUsername.label');
		
		var inputElement = document.createElement('input');
		inputElement.type = 'text';
		inputElement.className = 'commenterUsername';
		
		var formControlDiv = document.createElement('div');
		formControlDiv.className = 'commentFormControl';
		formControlDiv.appendChild(inputElement);
		
		var formFieldDiv = document.createElement('div');
		formFieldDiv.className = 'commentFormField commenterUsername';
		formFieldDiv.appendChild(formLabelDiv);
		formFieldDiv.appendChild(formControlDiv);
		
		var buttonElement = document.createElement('input');
		buttonElement.type = 'button';
		buttonElement.className = 'postCommentButton';
		buttonElement.value = rileyman.blog.getResource('blogPost.postCommentButton.label');
		
		var commentFormLineDiv = document.createElement('div');
		commentFormLineDiv.className = 'commentFormLine';
		commentFormLineDiv.appendChild(formFieldDiv);
		commentFormLineDiv.appendChild(buttonElement);
		
		return commentFormLineDiv;
	}
	
	function createCommentDivArray() {
		var commentDivArray = new Array();
		var jqCommentList = jQuery(xmlBlogPost).find('commentList').find('comment');
		for ( var index = 0; index < jqCommentList.length; index++ ) {
			commentDivArray.push(rileyman.blog.createCommentDivFromXml(jqCommentList[index]));
		}
		return commentDivArray;
	}
	
	function initCommentController() {
		var initParams = new rileyman.blog.PostCommentInitParams();
		initParams.setJqBlogEntryArticle(jQuery(result));
		initParams.setXmlBlogPost(xmlBlogPost);
		
		var commentController = new rileyman.blog.PostCommentController(initParams);
		commentController.initialize();
	}
	
	return result;
};

rileyman.blog.createCommentDivFromXml = function(xmlComment) {
	var commentTextDiv = document.createElement('div');
	commentTextDiv.className = 'commentText';
	commentTextDiv.innerHTML = createCommentHtml(xmlComment);
	
	var commentInfoDiv = document.createElement('div');
	commentInfoDiv.className = 'commentInfo';
	commentInfoDiv.innerHTML = createCommentInfoText(xmlComment);
	
	var commentDiv = document.createElement('div');
	commentDiv.className = 'comment';
	commentDiv.appendChild(commentTextDiv);
	commentDiv.appendChild(commentInfoDiv);
	
	function createCommentHtml(xmlComment) {
		var html = jQuery(xmlComment).find('commentText').text();
		
		html = html.replace(/[\n\r]+/g, '<br>')
			.replace(/[\W\b\s]:\)/g, ' <img src="static/images/smilies/face_smile.gif"></img> ')
			.replace(/[\W\b\s];\)/g, ' <img src="static/images/smilies/face_wink.gif"></img> ')
			.replace(/[\W\b\s]:D/g, ' <img src="static/images/smilies/face_happy.gif"></img> ')
			.replace(/[\W\b\s]:[lL][oO][lL]/g, ' <img src="static/images/smilies/face_laugh.gif"></img> ')
			.replace(/[\W\b\s]:[pP]/g, ' <img src="static/images/smilies/face_tongue.gif"></img> ')
			.replace(/[\W\b\s]:[oO]/g, ' <img src="static/images/smilies/face_shock.gif"></img> ')
			.replace(/[\W\b\s]:\(/g, ' <img src="static/images/smilies/face_sad.gif"></img> ')
			.replace(/[\W\b\s]:\|/g, ' <img src="static/images/smilies/face_indifferent.gif"></img> ')
			.replace(/[\W\b\s];\(/g, ' <img src="static/images/smilies/face_cry.gif"></img> ')
			.replace('<img src="static/images/smilies/face_smile.gif"></img>', '<img src="static/images/smilies/face_smile.gif" alt=":)" title=":)"></img>')
			.replace('<img src="static/images/smilies/face_wink.gif"></img>', '<img src="static/images/smilies/face_wink.gif" alt=";)" title=";)"></img>')
			.replace('<img src="static/images/smilies/face_happy.gif"></img>', '<img src="static/images/smilies/face_happy.gif" alt=":D" title=":D"></img>')
			.replace('<img src="static/images/smilies/face_laugh.gif"></img>', '<img src="static/images/smilies/face_laugh.gif" alt=":lol" title=":lol"></img>')
			.replace('<img src="static/images/smilies/face_tongue.gif"></img>', '<img src="static/images/smilies/face_tongue.gif" alt=":p" title=":p"></img>')
			.replace('<img src="static/images/smilies/face_shock.gif"></img>', '<img src="static/images/smilies/face_shock.gif" alt=":O" title=":O"></img>')
			.replace('<img src="static/images/smilies/face_sad.gif"></img>', '<img src="static/images/smilies/face_sad.gif" alt=":(" title=":("></img>')
			.replace('<img src="static/images/smilies/face_indifferent.gif"></img>', '<img src="static/images/smilies/face_indifferent.gif" alt=":|" title=":|"></img>')
			.replace('<img src="static/images/smilies/face_cry.gif"></img>', '<img src="static/images/smilies/face_cry.gif" alt=";(" title=";("></img>')
			;
		
		return html;
	}
	
	function createCommentInfoText(xmlComment) {
		var text;
		
		if ( jQuery(xmlComment).find('commenterUsername').length == 1 ) {
			text = rileyman.blog.getResource('blogPost.commentInfoLine.withUsername')
				.replace('[COMMENTER_USERNAME]', jQuery(xmlComment).find('commenterUsername').text());
		} else {
			text = rileyman.blog.getResource('blogPost.commentInfoLine.noUsername');
		}
		
		var commentDateMillis = Number(jQuery(xmlComment).find('commentDate').text());
		text = text.replace('[DATE]', rileyman.blog.FormatUtils.formatDate(new Date(commentDateMillis), 'dateFormat'))
			.replace('[TIME]', rileyman.blog.FormatUtils.formatTime(new Date(commentDateMillis)));
		
		return text;
	}
	
	return commentDiv;
};

rileyman.blog.createBlogPostSummaryFromXml = function(xmlBlogPost) {
	var postDateMillis = Number(jQuery(xmlBlogPost).find('postDate').text());
	
	var result = document.createElement('p');
	result.innerHTML =
		rileyman.blog.FormatUtils.formatDate(new Date(postDateMillis), 'summary.blogPost.dateFormat') + ' - ' +
		jQuery(xmlBlogPost).find('postTitle').text();
	
	return result;
};

rileyman.blog.PostCommentInitParams = function() {
	
	var jqBlogEntryArticle = null;
	var xmlBlogPost = null;
	
	this.getJqBlogEntryArticle = function() {
		return jqBlogEntryArticle;
	};
	this.setJqBlogEntryArticle = function(value) {
		jqBlogEntryArticle = value;
	};
	
	this.getXmlBlogPost = function() {
		return xmlBlogPost;
	};
	this.setXmlBlogPost = function(value) {
		xmlBlogPost = value;
	};
	
};

rileyman.blog.PostCommentController = function(initParams) {
	
	var URL = 'portals/servlets/blogPost';
	var Operation = {
		SAVE_NEW_COMMENT: 'SAVE_NEW_COMMENT',
	};
	
	var jqBlogEntryArticle = initParams.getJqBlogEntryArticle();
	var xmlBlogPost = initParams.getXmlBlogPost();
	
	this.initialize = function() {
		contractCommentFormFields();
		initializeEvents();
	};
	
	function initializeEvents() {
		jqBlogEntryArticle.find('div.commentCount').click(onCommentCountClick);
		jqBlogEntryArticle.find('textarea.commentText').focus(onCommentTextAreaFocus);
		jqBlogEntryArticle.find('input.postCommentButton').click(onPostCommentButtonClick);
	}
	
	function onCommentCountClick() {
		jqBlogEntryArticle.find('div.comment').toggle();
	}
	
	function onCommentTextAreaFocus() {
		expandCommentFormFields();
	}
	
	function onPostCommentButtonClick() {
		disableCommentFormFields();
		
		jQuery.ajax({
			type: 'POST',
			url: URL,
			data: {
				operation: Operation.SAVE_NEW_COMMENT,
				blogId: jQuery(xmlBlogPost).find('blogId').text(),
				postId: jQuery(xmlBlogPost).find('postId').text(),
				commentText: jqBlogEntryArticle.find('textarea.commentText').val(),
				commenterUsername: jqBlogEntryArticle.find('input.commenterUsername').val(),
			},
			dataType: 'xml',
			success: processSaveNewCommentResult,
			error: processRequestError,
		});
	}
	
	function processSaveNewCommentResult(data, textStatus, jqXHR) {
		var jqSaveNewCommentResult = jQuery(data).children('saveNewCommentResult');
		var success = jqSaveNewCommentResult.attr('success');
		
		if ( success == 'true' ) {
			var xmlComment = jqSaveNewCommentResult.children('comment');
			var commentDiv = rileyman.blog.createCommentDivFromXml(xmlComment);
			jQuery(commentDiv).addClass('newComment');
			jqBlogEntryArticle.find('div.postCommentArea').after(commentDiv);
			
			enableCommentFormFields();
			clearCommentFormFields();
			contractCommentFormFields();
		} else {
			var failureReason = jqSaveNewCommentResult.attr('failureReason');
			alert(rileyman.blog.getResource('error.saveNewComment.' + failureReason));
			
			enableCommentFormFields();
		}
	}
	
	function processRequestError() {
		enableCommentFormFields();
		expandCommentFormFields();
		
		alert(rileyman.blog.getResource('error.saveNewComment.request'));
	}
	
	function expandCommentFormFields() {
		var commentTextElement = jqBlogEntryArticle.find('textarea.commentText').get(0);
		commentTextElement.style.height = '4.25em';
		commentTextElement.style.resize = 'vertical';
		commentTextElement.style.cursor = 'auto';
		
		jqBlogEntryArticle.find('div.commentFormLine').show();
	}
	
	function contractCommentFormFields() {
		var commentTextElement = jqBlogEntryArticle.find('textarea.commentText').get(0);
		commentTextElement.style.height = null;
		commentTextElement.style.resize = null;
		commentTextElement.style.cursor = null;
		
		jqBlogEntryArticle.find('div.commentFormLine').hide();
	}
	
	function disableCommentFormFields() {
		jqBlogEntryArticle.find(':input').prop('disabled', true);
	}
	
	function enableCommentFormFields() {
		jqBlogEntryArticle.find(':input').prop('disabled', false);
	}
	
	function clearCommentFormFields() {
		jqBlogEntryArticle.find('textarea.commentText').val('');
		jqBlogEntryArticle.find('input.commenterUsername').val('');
	}
	
};
