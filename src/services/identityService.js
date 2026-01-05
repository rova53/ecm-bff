const { createHttpClient, addAuthToken } = require('./httpClient');
const config = require('../config');

class IdentityService
{
    constructor()
    {
        this.client = createHttpClient();
        this.baseUrl = config.services.identity.baseUrl;
    }

    /**
     * User login
     */
    async login(credentials)
    {
        const requestConfig = {
            method: 'POST',
            url: `${this.baseUrl}${config.services.identity.endpoints.login}`,
            data: credentials,
        };

        const response = await this.client(requestConfig);
        return response.data;
    }

    /**
     * User registration
     */
    async register(userData)
    {
        const requestConfig = {
            method: 'POST',
            url: `${this.baseUrl}${config.services.identity.endpoints.register}`,
            data: userData,
        };

        const response = await this.client(requestConfig);
        return response.data;
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken)
    {
        const requestConfig = {
            method: 'POST',
            url: `${this.baseUrl}${config.services.identity.endpoints.refresh}`,
            data: { refreshToken },
        };

        const response = await this.client(requestConfig);
        return response.data;
    }

    /**
     * Get user profile
     */
    async getProfile(token)
    {
        const requestConfig = {
            method: 'GET',
            url: `${this.baseUrl}${config.services.identity.endpoints.profile}`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Update user profile
     */
    async updateProfile(profileData, token)
    {
        const requestConfig = {
            method: 'PUT',
            url: `${this.baseUrl}${config.services.identity.endpoints.profile}`,
            data: profileData,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }

    /**
     * Logout user
     */
    async logout(token)
    {
        const requestConfig = {
            method: 'POST',
            url: `${this.baseUrl}/auth/logout`,
        };

        const response = await this.client(addAuthToken(requestConfig, token));
        return response.data;
    }
}

module.exports = new IdentityService();
