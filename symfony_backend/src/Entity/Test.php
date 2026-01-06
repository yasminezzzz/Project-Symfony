<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity]
class Test
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Subject::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Subject $subject = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $tutor = null;

    #[ORM\OneToMany(mappedBy: 'test', targetEntity: Question::class, cascade: ['persist'], orphanRemoval: true)]
    private Collection $questions;

    #[ORM\OneToMany(mappedBy: 'test', targetEntity: StudentTest::class, cascade: ['persist'], orphanRemoval: true)]
    private Collection $studentTests;

    public function __construct()
    {
        $this->questions = new ArrayCollection();
        $this->studentTests = new ArrayCollection();
    }

    // ----------- Getters & Setters -----------

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSubject(): ?Subject
    {
        return $this->subject;
    }

    public function setSubject(Subject $subject): self
    {
        $this->subject = $subject;
        return $this;
    }

    public function getTutor(): ?User
    {
        return $this->tutor;
    }

    public function setTutor(User $tutor): self
    {
        $this->tutor = $tutor;
        return $this;
    }

    /** @return Collection|Question[] */
    public function getQuestions(): Collection
    {
        return $this->questions;
    }

    public function addQuestion(Question $question): self
    {
        if (!$this->questions->contains($question)) {
            $this->questions[] = $question;
            $question->setTest($this);
        }
        return $this;
    }

    public function removeQuestion(Question $question): self
    {
        if ($this->questions->removeElement($question)) {
            if ($question->getTest() === $this) {
                $question->setTest(null);
            }
        }
        return $this;
    }

    /** @return Collection|StudentTest[] */
    public function getStudentTests(): Collection
    {
        return $this->studentTests;
    }

    public function addStudentTest(StudentTest $studentTest): self
    {
        if (!$this->studentTests->contains($studentTest)) {
            $this->studentTests[] = $studentTest;
            $studentTest->setTest($this);
        }
        return $this;
    }

    public function removeStudentTest(StudentTest $studentTest): self
    {
        if ($this->studentTests->removeElement($studentTest)) {
            if ($studentTest->getTest() === $this) {
                $studentTest->setTest(null);
            }
        }
        return $this;
    }
}
