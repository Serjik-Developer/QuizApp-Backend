const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('node:crypto'); // CommonJS
const jwt = require('jsonwebtoken');


const app = express();
const port = process.env.PORT || 3000;

const db = new sqlite3.Database('./db.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the Quiz database.');
});

app.use(express.json());



const tokenKey = '1a2b-3c4d-5e6f-7g8h';

app.use(express.json());

// Middleware для проверки токена
app.use((req, res, next) => {
    if (req.headers.authorization) {
        jwt.verify(
            req.headers.authorization.split(' ')[1],
            tokenKey,
            (err, payload) => {
                if (err) next();
                else if (payload) {
                    db.get(
                        'SELECT role, id, login, exp FROM user WHERE id = ?',
                        [payload.id],
                        (err, row) => {
                            if (!err && row) {
                                req.user = row;
                                next();
                            } else {
                                next();
                            }
                        }
                    );
                }
            }
        );
    } else {
        next();
    }
});

app.post('/register', (req, res) => {
    const { login, password } = req.body;
    if (!login || !password) {
        return res
            .status(400)
            .json({ message: 'Login and password are required' });
    }

    // Проверка, существует ли пользователь с таким логином
    db.get(
        'SELECT id FROM user WHERE login = ?',
        [login],
        (err, row) => {
            if (err) {
                return res
                    .status(500)
                    .json({ message: 'Database error' });
            }
            if (row) {
                return res
                    .status(409)
                    .json({ message: 'User already exists' });
            }
            else {
            let id = crypto.randomUUID();
            // Добавление нового пользователя
            db.run(
                'INSERT INTO user (login, password, id, exp, role) VALUES (?, ?, ? , ?, ?)',
                [login, password, id, 0, "user"],
                function (err) {
                    if (err) {
                        return res
                            .status(500)
                            .json({ message: 'Database error ' + err });
                    }

                    // Создание токена


                    // Возвращение данных о пользователе
                    return res.status(200).json({
                        login: login,
                        token: jwt.sign({ id: id }, tokenKey),
                    })
                }
            );
        }
        }
    );
});


// Авторизация пользователя
app.post('/auth', (req, res) => {
    const { login, password } = req.body;

    db.get(
        'SELECT id, login FROM user WHERE login = ? AND password = ?',
        [login, password],
        (err, row) => {
            if (err) {
                return res
                    .status(500)
                    .json({ message: 'Database error' });
            }
            if (!row) {
                return res
                    .status(404)
                    .json({ message: 'User not found' });
            }

            return res.status(200).json({
                login: row.login,
                token: jwt.sign({ id: row.id }, tokenKey),
            });
        }
    );
});


//GET INFO ABOUT CURRENT USER
app.get('/user', (req, res) => {
    if (req.user) return res.status(200).json( {login: req.user.login, exp: req.user.exp});
    else
        return res
            .status(401)
            .json({ message: 'Not authorized' });
});

app.get('/test', (req, res) => {

      return res
          .status(401)
          .json({ message: 'test' });
});




// GET all Quiz
app.get('/Quiz', (req, res) => {
  if (req.user) {
  db.all('SELECT * FROM Quiz', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Internal server error'});
    } else {
      res.status(200).send(rows);
    }
  });}
  else {
    return res
    .status(401)
    .json({ message: 'Not authorized' });
  }
});



// GET single Quiz by ID
app.get('/Quiz/:id', (req, res) => {
  if (req.user) {
  const { id } = req.params;
  db.get('SELECT * FROM Quiz WHERE Id = ?', [id], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (!row) {
      res.status(404).send('Quiz not found');
    } else {
      res.send(row);
    }
  });}
  else {
    return res
    .status(401)
    .send("Not authorized");
  }
});




// POST new Quiz
app.post('/Quiz', (req, res) => {
  if (req.user.role == "admin") {
  const { Text, Description } = req.body;
  if (!Text || !Description) {
    res.status(400).send('Text and Description are required');
  } else {
    let id = crypto.randomUUID();
    const sql = 'INSERT INTO Quiz(Id, Text, Description) VALUES (?, ?, ?)';
    db.run(sql, [id , Text, Description], function(err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal server error');
      } else {
        const id = this.lastID;
        res.status(201).send({ id, Text, Description });
      }
    });}

  }
  else {
    return res
    .status(401)
    .send("Not authorized as an admin");
  }
});




// PUT update Quiz by ID
app.put('/Quiz/:id', (req, res) => {
  if (req.user.role == "admin") {
  const { id } = req.params;
  const { Text, Description } = req.body;
  if (!Text || !Description) {
    res.status(400).send('Text and description are required');
  } else {
    const sql = 'UPDATE Quiz SET Text = ?, Description = ? WHERE Id = ?';
    db.run(sql, [Text, Description, id], function(err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal server error');
      } else if (this.changes === 0) {
        res.status(404).send('Quiz not found');
      } else {
        res.status(200).send({ id, Text, Description });
      }
    });
  }
}
else {
  return res
  .status(401)
  .send("Not authorized as an admin");
}
});




// DELETE Quiz by ID
app.delete('/Quiz/:id', (req, res) => {
  if (req.user.role == "admin") {
  const { id } = req.params;
  db.run('DELETE FROM Quiz WHERE Id = ?', [id], function(err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (this.changes === 0) {
      res.status(404).send('Quiz not found');
    } else {
      res.status(204).send();
    }
  });
}
else {
  return res
  .status(401)
  .send("Not authorized as an admin");
}
});
// GET ALL ABOUT QUIZ QUESTIONS BY QUIZ ID
app.get('/QuestionsAdmin/:id', (req, res) => {
  if (req.user.role == "admin") {
    const { id } = req.params;
  db.all('SELECT * FROM Questions WHERE id = ?',[id], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Internal server error'});
    } else {
      res.status(200).send(rows);
    }
  });}
  else {
    return res
    .status(401)
    .json({ message: 'Not authorized' });
  }
});

// GET ALL ABOUT QUIZ ANSWERS BY QUIZ ID
app.get('/AnswersAdmin/:qid', (req, res) => {
  if (req.user.role == "admin") {
    const { qid } = req.params;
  db.all('SELECT * FROM Answers WHERE qid = ?',[qid], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Internal server error'});
    } else {
      res.status(200).send(rows);
    }
  });}
  else {
    return res
    .status(401)
    .json({ message: 'Not authorized' });
  }
});
// DELETE QuizQuestion by Question ID

app.delete('/QuizQuestion/:qid', (req, res) => {
  if (req.user.role == "admin") {
  const { qid } = req.params;
  db.run('DELETE FROM Questions WHERE qid = ?', [qid], function(err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (this.changes === 0) {
      res.status(404).send('Question not found');
    } else {
      res.status(204).send();
    }
  });
}
else {
  return res
  .status(401)
  .send("Not authorized as an admin");
}
});

// DELETE QuizAnswer by AnswerID

app.delete('/QuizAnswer/:aid', (req, res) => {
  if (req.user.role == "admin") {
  const { aid } = req.params;
  db.run('DELETE FROM Answers WHERE aid = ?', [aid], function(err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (this.changes === 0) {
      res.status(404).send('Answer not found');
    } else {
      res.status(204).send();
    }
  });
}
else {
  return res
  .status(401)
  .send("Not authorized as an admin");
}
});

// PUT QuizQuestion by Question ID

app.put('/QuizQuestion/:qid', (req, res) => {
  if (req.user.role == "admin") {
  const { qid } = req.params;
  const { question } = req.body;
  if (!question) {
    res.status(400).send('New question and type are required');
  } 
  else {
    const sql = 'UPDATE Questions SET question = ? WHERE qid = ?';
    db.run(sql, [question, qid], function(err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal server error');
      } else if (this.changes === 0) {
        res.status(404).send('Question not found');
      } else {
        res.status(200).send({ question, qid });
      }
    });
  }
}
else {
  return res
  .status(401)
  .send("Not authorized as an admin");
}
});

// PUT Quiz Answer by Answer ID
app.put('/QuizAnswer/:aid', (req, res) => {
  if (req.user.role == "admin") {
  const { aid } = req.params;
  const { text, explanation, trueQustion } = req.body;
  if (!explanation|| !trueQustion) {
    res.status(400).send('New question and type are required');
  } else {
    const sql = 'UPDATE Answers SET text = ?, explanation = ?, true = ? WHERE aid = ?';
    db.run(sql, [text, explanation, trueQustion, aid], function(err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal server error');
      } else if (this.changes === 0) {
        res.status(404).send('Answer not found');
      } else {
        res.status(200).send({ text, explanation, trueQustion, aid });
      }
    });
  }
}
else {
  return res
  .status(401)
  .send("Not authorized as an admin");
}
});

// POST Quiz Question by Quiz ID
app.post('/QuizQuestion/:id', (req, res) => {
  if (req.user.role == "admin") {
  const { id } = req.params;
  const { Question, Type} = req.body;

  db.get('SELECT * FROM Quiz WHERE Id = ?', [id], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (!row) {
      res.status(404).send('Quiz not found');
    } else {
      if (!Question || !Type ) {
        res.status(400).send('All params are required');
      } 
      else if (Type != "InputString" && Type != "InputInt" && Type!= "RadioButton" && Type != "MultiChoiseImage") {
        res.status(400).send('unknown type');
      }
      else {
        let qid = crypto.randomUUID();
        const sql = 'INSERT INTO Questions(id, qid, question, type) VALUES (?, ?, ?, ?)';
        db.run(sql, [id , qid, Question, Type], function(err) {
          if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
          } else {
            res.status(201).send({ id , qid, Question, Type });
          }
        });
      }
    }
  });
}
else {
  return res
  .status(401)
  .send("Not authorized as an admin");
}
});
// POST Quiz Answer by Quiz Question ID
app.post('/QuizAnswer/:qid', (req, res) => {
  if (req.user.role == "admin") {
  const { qid } = req.params;
  const { Text, Explanation, True} = req.body;

  db.get('SELECT * FROM Questions WHERE qid = ?', [qid], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (!row) {
      res.status(404).send('Question not found');
    } else {
      let type = row.type
      if (!Explanation || !True ) {
        res.status(400).send('All params are required');
      } else {
        let aid = crypto.randomUUID();
        if (type =="InputString" || type == "InputInt" || type== "RadioButton" || type == "MultiChoiseImage") {

        
        if ((type != "MultiChoiseImage") || (type=="MultiChoiseImage")) {

        
        const sql = 'INSERT INTO Answers(qid, aid, text, explanation, true) VALUES (?, ?, ?, ?, ?)';
        db.run(sql, [qid , aid, Text, Explanation, True], function(err) {
          if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
          } else {
            res.status(201).send({ qid , aid, Text, Explanation, True });
          }
        });
      }

      else {
        res.status(400).send("For MultiChoiseImage need image, For others need text")
      }
    }
    else {
      res.status(400).send("Unknown type")
    }
    }
    }
  });
}
else {
  return res
  .status(401)
  .send("Not authorized as an admin");
}
});






//PUT USER EXP BY USER ID
app.post('/UserExp/:id', (req, res) => {
  if (req.user.role == "admin") {
    const { id } = req.params;
    const { exp } = req.body;
    if (!exp) {
      res.status(400).send('New exp count is required');
    } else {
      db.all('SELECT id FROM user WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error(err.message);
          res.status(500).send('Internal server error');
        } else if (!row) {
          res.status(404).send('User not found');
        } else {
          db.run('UPDATE user SET exp = ? WHERE id = ?', [exp, id], (err, row1) => {
            if (err) {
              console.error(err.message);
              res.status(500).send('Internal server error');
            } else {
              res.status(200).send("exp has updated!");
            }
          });
        }
      });
    }
  }
  else {
    return res
    .status(401)
    .send("Not authorized as admin");
  }
});


//GET All Quiz Question ID by Quiz ID
app.get('/QuizQustionsForUser/:id', (req, res) => {
  if (req.user) {
  const { id } = req.params;
  db.all('SELECT qid FROM Questions WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Internal server error' });
    } else if (!row) {
      res.status(404).json({ message: 'Quiz not found'});
    } else {
      res.status(200).json(row);
    }
  });}
  else {
    return res
    .status(401)
    .json({ message: 'Not authorized'});
  }
});



// GET Quiz Question and variant of answer for User
app.get('/QuizQustionForUser/:qid', (req, res) => {
  if (req.user) {
  const { qid } = req.params;
  db.get('SELECT * FROM Questions WHERE qid = ?', [qid], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (!row) {
      res.status(404).send('Quiz question not found');
    } else {
      let type = row.type
      let textQ = row.question
      if (row.type=="InputString" || row.type=="InputInt") {
        db.get('SELECT text, aid FROM Answers WHERE qid = ?', [qid], (err, answers) => {
          if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
          } else if (!row) {
            res.status(404).send('Quiz question not found');
          } else { 


            res.status(200).send( {answers, type, textQ})
          }});
        
      }
      else if (row.type=="RadioButton") {
        db.all('SELECT text, aid FROM Answers WHERE qid = ?', [qid], (err, answers) => {
          if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
          } else if (!row) {
            res.status(404).send('Quiz question not found');
          } else { 

            
            res.status(200).send( {answers, type, textQ})
          }});
      }
      else if (row.type == "MultiChoiseImage") {
        db.all('SELECT text, aid, image FROM Answers WHERE qid = ?', [qid], (err, answers) => {
          if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
          } else if (!row) {
            res.status(404).send('Quiz question not found');
          } else { 

            
            res.status(200).send( {answers, type, textQ})
          }});
      }

      else {
        res.status(400).send("Unknown type");
      }
    }
  });
}
else {
  return res
  .status(401)
  .send("Not authorized");
}
});

//POST Answer for User
app.post('/QuizAnswerForUser/:aid', (req, res) => {
  if (req.user) {
  const { aid } = req.params;
  const { AnswerUser } = req.body;

  db.get('SELECT explanation, true FROM Answers WHERE aid = ?', [aid], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (!row) {
      res.status(404).send('Answer not found');
    } else {
      if (!AnswerUser) {
        res.status(400).send('Answer User is required');
      } else {
          let explanation =  row.explanation
          let correct = row.true
          if (String(AnswerUser) == String(row.true)) {
            db.run('UPDATE user SET exp = exp + ? WHERE id = ?', [1, req.user.id], (err) => {
              if (err) {
                console.error(err.message);
                res.status(500).send('Internal server error');
              } else {
                res.status(200).send({"status": "GOOD" , explanation, correct, "your": AnswerUser})
              }
            });
          }
          else {


            res.status(200).send({"status": "BAD" , explanation, correct, "your": AnswerUser})
          }
      }
    }
  });
}
else {
  return res
  .status(401)
  .send("Not authorized");
}
});



let ip = "0.0.0.0"
// Start the server
app.listen(port, ip,  () => {
  console.log(`Server listening on port ${port}.`);
});
