const {
  topicData,
  articleData,
  commentData,
  userData
} = require("../data/index.js");

const { formatDates, formatComments, makeRefObj } = require("../utils/utils");

exports.seed = function(knex) {
  return knex.migrate
    .rollback()
    .then(() => knex.migrate.latest())
    .then(() => {
      const topicsInsertions = knex("topics")
        .insert(topicData)
        .returning("*");
      const usersInsertions = knex("users")
        .insert(userData)
        .returning("*");

      return Promise.all([topicsInsertions, usersInsertions]);
    })
    .then(() => {
      const updatedArticleData = formatDates(articleData);
      return knex("articles")
        .insert(updatedArticleData)
        .returning("*");
    })
    .then(articleRows => {
      let formattedCommentData = formatDates(commentData);
      let referenceObj = makeRefObj(articleRows);
      console.log(
        referenceObj,
        "<-- refObj",
        formattedCommentData,
        "<-- comment data"
      );
      formattedCommentData = formatComments(formattedCommentData, referenceObj);
      return knex("comments")
        .insert(formattedCommentData)
        .returning("*");
      /* 

      Your comment data is currently in the incorrect format and will violate your SQL schema. 

      Keys need renaming, values need changing, and most annoyingly, your comments currently only refer to the title of the article they belong to, not the id. 
      
      You will need to write and test the provided makeRefObj and formatComments utility functions to be able insert your comment data.
      */

      const articleRef = makeRefObj(articleRows);
      const formattedComments = formatComments(commentData, articleRef);
      return knex("comments").insert(formattedComments);
    });
};
