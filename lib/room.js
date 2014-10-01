module.exports = function(id, owner) {
	console.log('Created new room id: ' + id);
	return {
		id: id,
		owner: owner,
		drawerIndex: 0,
		users: [],
		word: "",
		password: "",
		usedWords: [],

		newWord: function(words) {
			this.usedWords.push(this.word);
			if (this.usedWords.length >= words.length) {
				this.usedWords = [];
			}
			do {
				this.word = words[require('chance')().integer({min: 0, max: words.length})];
			}
			while (this.usedWords.indexOf(this.word) != -1);
		},

		newDrawer: function() {
			this.drawerIndex++;
			if (this.drawerIndex >= this.users.length) {
				this.drawerIndex = 0;
			}
		},

		getDrawer: function() {
			return this.users[this.drawerIndex];
		}
	};
}