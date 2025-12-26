module.exports = async () => {
  process.env.TZ = 'UTC';
  process.env.E621_GLOBAL_USERNAME = 'jest_test_user_placeholder';
  process.env.E621_GLOBAL_API_KEY = 'abcdef0123456789abcdef0123456789';
};
