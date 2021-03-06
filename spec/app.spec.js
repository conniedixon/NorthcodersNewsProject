process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiSorted = require("chai-sorted");
const { expect } = chai.use(chaiSorted);
const request = require("supertest");
const app = require("../app");
const connection = require("../db/connection");

describe("APP/API:", () => {
  beforeEach(() => connection.seed.run());
  after(() => connection.destroy());
  it("Status 200: returns a JSON object of all possible endpoints", () => {
    return request(app).get("/api").expect(200)
    })
  
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
            .get("/api/users/butter_bridge")
            .expect(200)
            .then(({ body: { user } }) => {
              expect(user).to.be.an("object");
              expect(user).to.contain.keys("username", "avatar_url", "name");
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
    describe("GET", () => {
      it("Status 200: returns an array of articles", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).to.be.an("array");
            expect(articles[0]).to.contain.keys(
              "author",
              "title",
              "body",
              "article_id",
              "topic",
              "created_at",
              "votes"
            );
          });
      });
      it("Status 200: returns a comment count for each article", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles[0]).to.contain.keys("comment_count");
          });
      });
      it("Status 404: Path not found", () => {
        return request(app)
          .get("/api/artlicicles")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).to.eql("Path not found");
          });
      });
      it("Status 400: Bad Request", () => {
        return request(app).get("/api/articles?sort_by=not-a-column").expect(400).then(({body: {msg}})=>{
          expect(msg).to.eql("Bad Request")
        })
      })
      describe("QUERIES", () => {
        describe("PAGINATION/LIMIT", () => {
          it("Status 200: Accepts a pagination and response limit", () => {
            return request(app).get("/api/articles?limit=3,p=1").expect(200).then(({body: {articles}})=>{
              expect(articles).to.have.length(3)
            })
          })
          it("Status 200: Defualts to 1 page and 10 comments", () => {
            return request(app).get("/api/articles").expect(200).then(({body: {articles}})=>{
              expect(articles).to.have.length(10)
            })
          })
        })
        describe("SORT_BY", () => {
          it("Status 200: returns an array of articles sorted by a default of date", () => {
            return request(app)
              .get("/api/articles?sort_by=author")
              .expect(200)
              .then(({ body: { articles } }) => {
                expect(articles).to.be.sortedBy("author", {
                  descending: true
                });
              });
          });
          it("Status 404: Column not found", () => {
           return  request(app)
              .get("/api/articles?sort_by=coolestarticle")
              .expect(400)
              .then(({ body: { msg } }) => {
                expect(msg).to.eql("Bad Request");
              });
          });
        });
        describe("ORDER", () => {
          it("Status 200: returns an array of articles ordered with a default of descending", () => {
            return request(app)
              .get("/api/articles?order=asc")
              .expect(200)
              .then(({ body: { articles } }) => {
                expect(articles).to.be.sorted({ descending: false });
              });
          });
        });
        describe("FILTERS", () => {
          describe("author", () => {
            it("200: when given an author, returns an array of articles filtering articles by username value specified in query", () => {
              return request(app)
                .get("/api/articles?author=rogersop")
                .expect(200)
                .then(({ body: { articles } }) => {
                  expect(articles).to.be.an("array");
                  expect(articles).to.have.length(3);
                });
            });
            it("Status 404: user does not exist", () => {
              return request(app)
                .get("/api/articles?author=supercooldude90")
                .expect(404)
                .then(({ body: { msg } }) => {
                  expect(msg).to.eql("user not found");
                });
            });
           
            it("200: when given an author with no articles, returns an empty array", () => {
              return request(app)
                .get("/api/articles?author=lurker")
                .expect(200)
                .then(({ body: { articles } }) => {
                  expect(articles).to.be.an("array");
                  expect(articles).to.have.length(0);
                  expect(articles).to.eql([]);
                });
            });
          });
          describe("topic", () => {
            it("200: when given a topic, returns an array of articles filtered by topic value specified in the query", () => {
              return request(app)
                .get("/api/articles?topic=cats")
                .expect(200)
                .then(({ body: { articles } }) => {
                  expect(articles).to.eql([
                    {
                      article_id: 5,
                      author: "rogersop",
                      body:
                        "Bastet walks amongst us, and the cats are taking arms!",
                      comment_count: "2",
                      created_at: "2002-11-19T12:21:54.000Z",
                      title: "UNCOVERED: catspiracy to bring down democracy",
                      topic: "cats",
                      votes: 0
                    }
                  ]);
                });
            });
            it("Status 404: topic does not exist", () => {
              return request(app)
                .get("/api/articles?topic=connie")
                .expect(404)
                .then(({ body: { msg } }) => {
                  expect(msg).to.eql("topic does not exist");
                });
            });
          
          });
        });
      });
      it("Status 404: Path not found", () => {
        return request(app)
          .get("/api/arcicles")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).to.eql("Path not found");
          });
      });
    });
    describe("/:article_id", () => {
      describe("GET", () => {
        it("Status 200: Returns an object with relevant keys", () => {
          return request(app)
            .get("/api/articles/2")
            .expect(200)
            .then(({ body: { article } }) => {
              expect(article).to.be.an("object");
              expect(article).to.contain.keys(
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
              expect(article).to.contain.keys("comment_count");
              expect(article.comment_count).to.eql("13");
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
        it("Status 400: Bad Request", () => {
          return request(app)
            .get("/api/articles/notAnArticle")
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).to.eql("Bad Request");
            });
        })
      });
      describe("PATCH", () => {
        it("Status 200: Responds with an object with relevant values and increments ", () => {
          return request(app)
            .patch("/api/articles/3")
            .send({ inc_votes: 1 })
            .expect(200)
            .then(({ body: { article } }) => {
              expect(article.votes).to.eql(1);
            });
        });
        it("Status 404: Custom message, path not found", () => {
          return request(app)
            .patch("/api/articles/10697")
            .send({ inc_votes: 1 })
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).to.eql("No article found for id 10697");
            });
        });
        it("Status 405: Invalid Method", () => {
          const invalidMethods = ["post", "put", "delete"];
          const methodPromises = invalidMethods.map(method => {
            return request(app)
              [method]("/api/articles/1")
              .expect(405)
              .then(({ body: { msg } }) => {
                expect(msg).to.equal("Invalid method");
              });
          });
          return Promise.all(methodPromises);
        });
        it("Status 400: Bad Request", () => {
          return request(app)
            .patch("/api/articles/notAnArticle")
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).to.eql("Bad Request");
            });
        });
      });
      describe("/comments", () => {
        describe("GET", () => {
          it("Status 200: returns an array of comments", () => {
            return request(app)
              .get("/api/articles/1/comments")
              .expect(200)
              .then(({ body: { comments } }) => {
                expect(comments).to.be.an("array");
                expect(comments[0]).to.contain.keys(
                  "comment_id",
                  "votes",
                  "created_at",
                  "author",
                  "body"
                );
              });
          });
          it("Status 200: returns an array of empty comments if the article exists but there are no comments", () => {
            return request(app).get("/api/articles/2/comments").expect(200).then(({body:{comments}})=>{
              expect(comments).to.eql([])
            })
          })
          describe("PAGINATION/LIMIT", () => {
            it("Status 200: Accepts a pagination and response limit", () => {
              return request(app).get("/api/articles/1/comments?limit=3,p=1").expect(200).then(({body: {comments}})=>{
                expect(comments).to.have.length(3)
              })
            })
            it("Status 200: Defualts to 1 page and 10 comments", () => {
              return request(app).get("/api/articles/1/comments").expect(200).then(({body: {comments}})=>{
                expect(comments).to.have.length(10)
              })
            })
          })
          it("Status 404: Path not found", () => {
            return request(app)
            .get("/api/articles/700000/comments")
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).to.eql("Path not found");
            });
          });
          it("Status 400: Bad Request", () => {
            return request(app)
            .post("/api/articles/notAnArticle/comments")
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).to.eql("Bad Request");
            });
          });
          it("Status 200: Responds with an array of comments sorted by a default if the query does not exist", () => {
            return request(app).get("/api/articles/1/comments?sort_by=not-a-valid-column").expect(400).then(({body: {msg}})=> {
              expect(msg).to.eql("Bad Request")
            })
          })
        });
        describe("POST", () => {
          it("Status 201: Responds with created comment", () => {
            return request(app)
              .post("/api/articles/3/comments")
              .send({
                username: "butter_bridge",
                body: "I love posting comments"
              })
              .expect(201)
              .then(({ body: { comment } }) => {
                expect(comment.body).to.eql("I love posting comments");
              });
          });
          it("Status 400: POST does not include required keys", () => {
            return request(app).post("/api/articles/3/comments").send({username: 1275}).expect(400).then(({body: {msg}})=>{
              expect(msg).to.eql("Bad Request")
            })
          })
          it("Status 400: Bad Request", () => {
            return request(app)
              .post("/api/articles/notAnArticle/comments")
              .send({
                username: "butter_bridge",
                body: "I love posting comments"
              })
              .expect(400)
              .then(({ body: { msg } }) => {
                expect(msg).to.eql("Bad Request");
              });
          });
          it("Status 405: Invalid Method", () => {
            const invalidMethods = ["put", "delete"];
            const methodPromises = invalidMethods.map(method => {
              return request(app)
                [method]("/api/articles/1/comments")
                .expect(405)
                .then(({ body: { msg } }) => {
                  expect(msg).to.equal("Invalid method");
                });
            });
            return Promise.all(methodPromises);
          });
          it("Status 404: Path not found", () => {
            return request(app)
              .post("/api/articles/10000/comments")
              .send({
                username: "butter_bridge",
                body: "I love posting comments!"
              })
              .expect(404)
              .then(({ body: { msg } }) => {
                expect(msg).to.eql("article not found");
              });
          });
        });
      });
    });
  });
  describe("/COMMENTS", () => {
    describe("/comment:id", () => {
      describe("PATCH", () => {
        it("Status 200: Responds with an object with relevant values and increments ", () => {
          return request(app)
            .patch("/api/comments/1")
            .send({ inc_votes: 1 })
            .expect(200)
            .then(({ body: { comment } }) => {
              expect(comment).to.be.an("object");
              expect(comment.votes).to.eql(17);
            });
        });
        it("Status 200: REsponds with an unchanged comment when given no inc_votes property", () => {
          return request(app).patch("/api/comments/1").send({})
          .expect(200)
          .then(({ body: { comment } }) => {
            expect(comment).to.be.an("object");
            expect(comment.votes).to.eql(16);
          })
        })
        it("Status 404: Custom message, path not found", () => {
          return request(app)
            .patch("/api/comments/10000000")
            .send({ inc_votes: 1 })
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).to.eql("No comments found for id 10000000");
            });
        });
        it("Status 400: Bad Request", () => {
          return request(app)
            .patch("/api/comments/notAnArticle")
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).to.eql("Bad Request");
            });
        });
      });
      describe("DELETE", () => {
        it("Status 204: No response", () => {
          return request(app)
            .delete("/api/comments/1")
            .expect(204);
        });
        it("Status 404: Path not found", () => {
          return request(app)
            .delete("/api/commments/1")
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).to.eql("Path not found");
            });
        });
        it("Status 405: Method not allowed", () => {
          const invalidMethods = ["post", "put", "get"];
          const methodPromises = invalidMethods.map(method => {
            return request(app)
              [method]("/api/comments/1")
              .expect(405)
              .then(({ body: { msg } }) => {
                expect(msg).to.equal("Invalid method");
              });
          });
          return Promise.all(methodPromises);
        });
      })
    });
  });
});
