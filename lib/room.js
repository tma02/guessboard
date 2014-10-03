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
		timer: 90,
		maxTime: 90,

		newWord: function(words) {
			this.usedWords.push(this.word);
			if (this.usedWords.length >= words.length) {
				this.usedWords = [];
			}
			do {
				this.word = words[require('chance')().integer({min: 0, max: words.length})];
			}
			while (this.usedWords.indexOf(this.word) != -1);
			this.timer = this.maxTime;
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
		},

		startTimer: function(newDrawerAndWord, io) {
			var self = this;
			setInterval(function() {
				if (self.timer > 0 && self.users.length >= 2) {
					self.timer--;
				}
				else {
					newDrawerAndWord(self.id);
					self.timer = self.maxTime;
					io.to(self.id).emit('chat', {user: 'sys', message: 'Times up!'});
				}
			}, 1000);
		}
	};
}