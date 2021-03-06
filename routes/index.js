const adminController = require('../controllers/adminController')
const tweetController = require('../controllers/tweetController')
const userController = require('../controllers/userController')

const helpers = require('../_helpers')

const multer = require('multer')
const chatController = require('../controllers/chatController')
const upload = multer({ dest: 'temp/' })

module.exports = (app, passport) => {

  const authenticated = (req, res, next) => {
    if (helpers.ensureAuthenticated(req)) {
      if (helpers.getUser(req).role !== 'admin') {
        return next()
      } else {
        req.flash('error_messages', '管理員請使用後台')
        return res.redirect('/admin/tweets')
      }
    }
    res.redirect('/signin')
  }

  const authenticatedAdmin = (req, res, next) => {
    if (helpers.ensureAuthenticated(req)) {
      if (helpers.getUser(req).role === 'admin') {
        return next()
      } else {
        req.flash('error_messages', '請登入正確帳號!')
        return res.redirect('/admin/signin')
      }
    }
    res.redirect('/admin/signin')
  }

  app.get('/', authenticated, (req, res) => {
    res.redirect('/tweets')
  })

  // User tweet
  app.get('/tweets', authenticated, userController.getRecommendedFollowings, tweetController.getTweets) // 顯示所有 tweet
  app.post('/tweets', authenticated, userController.getRecommendedFollowings, tweetController.postTweet) // 新增 tweet
  app.post('/tweets/:id/like', authenticated, tweetController.addLike)
  app.post('/tweets/:id/unlike', authenticated, tweetController.removeLike)
  app.get('/tweets/:id', authenticated, userController.getRecommendedFollowings, tweetController.getTweet) // 顯示單一 tweet
  app.post('/tweets/:id/replies', authenticated, tweetController.postReply) // 新增 reply
  app.get('/tweets/:id/replies', authenticated, tweetController.getReply) // for auto-test

  // 註冊頁
  app.get('/signup', userController.signUpPage)
  app.post('/signup', userController.signUp)
  // 前台登入頁
  app.get('/signin', userController.signInPage)
  // 前台登入
  app.post('/signin', passport.authenticate('local', {
    failureRedirect: '/signin',
    failureFlash: true
  }), userController.signIn)

  app.get('/signout', userController.signOut)

  // Admin
  app.get('/admin/signin', adminController.signInPage) // 後台登入頁
  app.post('/admin/signin', passport.authenticate('local', {
    failureRedirect: '/admin/signin',
    failureFlash: true
  }), adminController.signIn) // 後台登入
  app.get('/admin/signout', adminController.signOut) // 後台登出
  app.get('/admin/tweets', authenticatedAdmin, adminController.getTweets) // 後台推文清單
  app.get('/admin/users', authenticatedAdmin, adminController.getUsers) // 後台使用者清單
  app.delete('/admin/tweets/:id', authenticatedAdmin, adminController.deleteTweet) // 刪除後台推文

  // app.get('/admin', authenticatedAdmin, (req, res) => {
  //   res.redirect('/admin/tweets')
  // })

  // user 相關路由
  app.get('/users/:id/tweets', authenticated, userController.getRecommendedFollowings, userController.getUserTweets)
  app.get('/users/:id/likes', authenticated, userController.getRecommendedFollowings, userController.getUserLikes)
  app.get('/users/:id/replies', authenticated, userController.getRecommendedFollowings, userController.getUserReplies)

  // user edit 相關路由
  app.get('/api/users/:id', authenticated, userController.editUser) //for auto-test
  app.put('/users/:id/edit', authenticated,
    upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]), userController.putUserInfo)

  app.get('/users/:id/followers', authenticated, userController.getRecommendedFollowings, userController.getUserFollowers) // 被追蹤
  app.get('/users/:id/followings', authenticated, userController.getRecommendedFollowings, userController.getUserFollowings) // 追蹤人

  // setting 相關路由
  app.get('/users/:id/setting', authenticated, userController.getSetting)
  app.post('/api/users/:id', authenticated, userController.putSetting)

  // follow 相關路由
  app.post('/followships', authenticated, userController.addFollowing)
  app.delete('/followships/:userId', authenticated, userController.removeFollowing)

  //  chat 相關路由
  app.get('/chat', authenticated, chatController.getChat)


}
