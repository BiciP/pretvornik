// Razred za javljanje napak
export default class ParserError extends Error {
    constructor(message) {
        super();
        this.message = message
    }
}

// Sporočila napak
export const PARSE_ERROR_MESSAGE = {
    NOT_A_PD_FILE: "This is not a valid PowerDesigner file.",
}