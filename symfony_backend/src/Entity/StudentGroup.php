<?php

namespace App\Entity;

use App\Repository\StudentGroupRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: StudentGroupRepository::class)]
class StudentGroup
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 50)]
    private ?string $level = null; // Basic, Intermediate, Advanced

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Subject $subject = null;

    #[ORM\ManyToMany(targetEntity: User::class, inversedBy: 'studentGroups')]
    #[ORM\JoinTable(name: 'student_group_members')]
    private Collection $students;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->students = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): ?string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }

    public function getLevel(): ?string { return $this->level; }
    public function setLevel(string $level): self { $this->level = $level; return $this; }

    public function getSubject(): ?Subject { return $this->subject; }
    public function setSubject(?Subject $subject): self { $this->subject = $subject; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): self { $this->createdAt = $createdAt; return $this; }

    /**
     * @return Collection<int, User>
     */
    public function getStudents(): Collection { return $this->students; }

    public function addStudent(User $student): self
    {
        if (!$this->students->contains($student)) {
            $this->students->add($student);
            $student->addStudentGroup($this);
        }
        return $this;
    }

    public function removeStudent(User $student): self
    {
        if ($this->students->removeElement($student)) {
            $student->removeStudentGroup($this);
        }
        return $this;
    }
}
