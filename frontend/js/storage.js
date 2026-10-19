// Cookie db
export class CookieStorageDriver {
    get(key) {
        const nameEqual = key + "=";
        const cookieArray = document.cookie.split(';');
        for (let i = 0; i < cookieArray.length; i++) {
            let cookieCharacter = cookieArray[i].trim();
            if (cookieCharacter.indexOf(nameEqual) === 0) {
                return decodeURIComponent(cookieCharacter.substring(nameEqual.length, cookieCharacter.length));
            }
        }
        return null;
    }

    set(key, value) {
        const targetDate = new Date();
        // cookie store time up to 7 days
        targetDate.setTime(targetDate.getTime() + (7 * 24 * 60 * 60 * 1000));
        const expiresString = "; expires=" + targetDate.toUTCString();
        document.cookie = key + "=" + encodeURIComponent(value) + expiresString + "; path=/; SameSite=Strict";
    }
}

// LocalStorage db
export class LocalStorageStorageDriver {
    get(key) {
        return localStorage.getItem(key);
    }
    set(key, value) {
        localStorage.setItem(key, value);
    }
}
