module.exports = function(id, owner) {
	console.log('Created new room id: ' + id);
	return {
		id: id,
		owner: owner,
		drawerIndex: -1,
		users: [],
		word: "",
		password: "",
		usedWords: [],
		timer: 60,

		newWord: function(words) {
			this.usedWords.push(this.word);
			if (this.usedWords.length >= words.length) {
				this.usedWords = [];
			}
			do {
				this.word = words[require('chance')().integer({min: 0, max: words.length})];
			}
			while (this.usedWords.indexOf(this.word) != -1);
			this.timer = 60;
		},

		newDrawer: function() {
			this.drawerIndex++;
			if (this.drawerIndex >= this.users.length) {
				this.drawerIndex = 0;
			}
		},

		getDrawer: function() {
			if (this.drawerIndex == -1) {
				return {};
			}
			return this.users[this.drawerIndex];
		}
	};
}