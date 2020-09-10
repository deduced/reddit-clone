import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
    if (!options.email.includes("@")) { //dead simple validation for testing
        return [
            {
                field: "email",
                message: "invalid email address",
            },
        ]

    }

    if (options.username.length <= 2) {
        return [
            {
                field: "username",
                message: "username must be greater than 2",
            },
        ]

    }

    if (options.username.includes("@")) {
        return [
            {
                field: "username",
                message: "cannot include an @",
            },
        ]
    }

    if (options.password.length <= 2) {
        return [
            {
                field: "password",
                message: "length must be greater than 2",
            },
        ]
    }

    return null;
}