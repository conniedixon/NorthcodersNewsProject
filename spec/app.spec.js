const { expect } = require("chai");
const request = require("supertest");
const { app } = require("../app");

describe("APP/API:", () => {
  it("Status 404: Path not found", () => {
    return request(app)
      .get("/invalid")
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).to.eql("Path not found");
      });
  });
  describe("/TOPICS:", () => {
    describe("GET", () => {
      it("Status 200: returns an array of topics", () => {
        return request(app)
          .get("/api/topics")
          .expect(200)
          .then(({ body: { topics } }) => {
            expect(topics).to.be.an("array");
            expect(topics[0]).to.contain.keys("slug", "description");
          });
      });
      it("Status 404: Path not found", () => {
        return request(app)
          .get("/api/topix")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).to.eql("Path not found");
          });
      });
    });
  });
  describe("/USERS", () => {
    describe("/:username", () => {
      describe("GET", () => {
        it("Status 200: returns a user object with relevant keys", () => {
          return request(app)
            .get("/api/users/jessjelly")
            .expect(200)
            .then(({ body: { user } }) => {
              expect(user[0]).to.be.an("object");
              expect(user[0]).to.contain.keys("username", "avatar_url", "name");
            });
        });
        it("Status 404: Custom message user {username} not found", () => {
          return request(app)
            .get("/api/users/jessyjellie")
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).to.eql("No user found for username: jessyjellie");
            });
        });
      });
    });
  });
  describe("/ARTICLES", () => {
    describe("/:article_id", () => {
      describe("GET", () => {
        it("Status 200: Returns an object with relevant keys", () => {
          return request(app)
            .get("/api/articles/1")
            .expect(200)
            .then(({ body: { article } }) => {
              expect(article[0]).to.be.an("object");
              expect(article[0]).to.contain.keys(
                "author",
                "title",
                "article_id",
                "body",
                "topic",
                "created_at",
                "votes"
              );
            });
        });
        it("Status 200: Returns a comment count column", () => {
          return request(app)
            .get("/api/articles/1")
            .expect(200)
            .then(({ body: { article } }) => {
              expect(article[0]).to.contain.keys("comment_count");
              expect(article[0].comment_count).to.eql("0");
            });
        });
        it("Status 404: Returns custom message no article found for id {id}", () => {
          return request(app)
            .get("/api/articles/10697")
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).to.eql("No article found for id 10697");
            });
        });
      });
    });
  });
});
