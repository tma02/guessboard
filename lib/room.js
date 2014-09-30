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
			usedWords.push(word);
			do {
				word = words[require('chance').integer({min: 0, max: words.length})];
			}
			while (usedWords.indexOf(word) != -1);
		}
	};
}