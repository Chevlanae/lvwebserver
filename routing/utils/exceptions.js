class DBException extends Error {
	constructor(message, dbError) {
		super(message);
		this.dbError = dbError;
	}
}

module.exports = {
	DBException: DBException,
};
