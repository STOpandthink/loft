// Call init when we open the website and also when we login.
function init() {
	Session.set("loginError", "");
	Session.set("registerError", "");
	Meteor.call("canTrophy", function(err, result) {
		Session.set("canTrophy", result);
	});
	Meteor.call("getPostsLeft", function(err, result) {
		console.log("Posts left: " + result + " " + err);
		Session.set("postsLeft", result);
	});
	Meteor.call("getDebugInfo", function(err, result) {
		console.log(result);
	});
}

// Return cleaned and safe version of the given string.
function escapeHtml(str) {
	var div = document.createElement('div');
	div.appendChild(document.createTextNode(str));
	console.log(div.innerHTML.replace("\n", "<br>"));
	return div.innerHTML.replace(/\n/g, "<br>");
}

// This code only runs on the client
if (Meteor.isClient) {
	Meteor.subscribe("posts");
	Meteor.subscribe("comments");
	init();

	// BODY
	Template.body.helpers({
		"posts": function () {
			return posts.find({}, {sort: {createdAt: -1}});
		},
		"canPost": function() {
			return Session.get("postsLeft") > 0;
		},
		"postsLeft": function() {
			return Session.get("postsLeft");
		}
	});
	Template.body.events({
		"submit .new-post": function (event) {
			console.log(event);

			var text = event.target.text.value;
			Meteor.call("addPost", text, function(err, result) {
				if (!err) {
					Session.set("postsLeft", Session.get("postsLeft") - 1);
				} else {
					// TODO: show error
				}
			});

			// Clear form
			event.target.text.value = "";

			// Prevent default form submit
			return false;
		},
		"submit .new-comment": function (event) {
			console.log(event);

			var text = event.target.text.value;
			Meteor.call("addComment", this._id, text, function(err, result) {
				if (!err) {
				} else {
					// TODO: show error
				}
			});

			// Clear form
			event.target.text.value = "";

			// Prevent default form submit
			return false;
		}
	});

	// POST
	Template.post.helpers({
		"safeText": function() {
			return escapeHtml(this.text);
		},
		"canTrophy": function() {
			return this.userId != Meteor.userId() && Session.get("canTrophy");
		},
		"comments": function() {
			return comments.find({postId: this._id}, {sort: {createdAt: 1}});
		}
	});
	Template.post.events({
		"click .trophy-button": function () {
			Meteor.call("addTrophy", this._id, function (err, result) {
				if (result) {
					Session.set("canTrophy", false);
				}
			});
		}
	});

	// COMMENT
	Template.comment.helpers({
		"safeText": function() {
			return escapeHtml(this.text);
		}
	});

	// LOGIN
	Template.login.events({
		"submit #login-form" : function(e, t){
			e.preventDefault();
			// retrieve the input field values
			var email = t.find("#login-email").value;
			var password = t.find("#login-password").value;

			// TODO: Trim and validate your fields here.... 
			
			// If validation passes, supply the appropriate fields to the
			// Meteor.loginWithPassword() function.
			Meteor.loginWithPassword(email, password, function(err){
				if (err) {
					// The user might not have been found, or their passwword
					// could be incorrect. Inform the user that their
					// login attempt has failed. 
					Session.set("loginError", String(err));
				} else {
					// The user has been logged in.
					init();
				}
			});
			return false; 
		},
		"submit #register-form" : function(e, t) {
			e.preventDefault();
			var email = t.find("#account-email").value;
			var password = t.find("#account-password").value;
			var profile = {
				firstName: t.find("#account-first-name").value,
				lastName: t.find("#account-last-name").value,
			};

			// TODO: Trim and validate the input

			var options = { email: email, password: password, profile: profile };
			Accounts.createUser(options, function(err) {
				if (err) {
					Session.set("registerError", String(err));
				} else {
					// Success. Account has been created and the user
					// has logged in successfully. 
					init();
				}
			});
			return false;
		}
	});
}
