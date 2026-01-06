<?php

namespace App\Service;

use App\Entity\StudentGroup;
use App\Entity\User;
use App\Entity\Test;
use Doctrine\ORM\EntityManagerInterface;

class StudentGroupService
{
    public function __construct(private EntityManagerInterface $em) {}

    public function createOrAssignGroup(User $student, Test $test, float $percentage): StudentGroup
    {
        $subject = $test->getSubject();

        // Determine group level based on percentage
        $level = $this->determineLevel($percentage);
        $groupName = $subject->getName() . ' - ' . $level;

        // Check if group already exists for this subject and level
        $groupRepository = $this->em->getRepository(StudentGroup::class);
        $existingGroup = $groupRepository->findOneBy([
            'name' => $groupName,
            'subject' => $subject,
            'level' => $level
        ]);

        if (!$existingGroup) {
            // Create new group
            $existingGroup = new StudentGroup();
            $existingGroup->setName($groupName)
                         ->setSubject($subject)
                         ->setLevel($level);

            $this->em->persist($existingGroup);
        }

        // Add student to group (if not already a member)
        if (!$existingGroup->getStudents()->contains($student)) {
            $existingGroup->addStudent($student);
        }

        $this->em->flush();

        return $existingGroup;
    }

    private function determineLevel(float $percentage): string
    {
        if ($percentage <= 49) {
            return 'Basic';
        } elseif ($percentage <= 75) {
            return 'Intermediate';
        } else {
            return 'Advanced';
        }
    }
}
