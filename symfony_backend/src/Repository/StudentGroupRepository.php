<?php

namespace App\Repository;

use App\Entity\StudentGroup;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<StudentGroup>
 */
class StudentGroupRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, StudentGroup::class);
    }

    // Example: find a group by subject and level
    public function findBySubjectAndLevel($subject, string $level): ?StudentGroup
    {
        return $this->createQueryBuilder('g')
            ->andWhere('g.subject = :subject')
            ->andWhere('g.level = :level')
            ->setParameter('subject', $subject)
            ->setParameter('level', $level)
            ->getQuery()
            ->getOneOrNullResult();
    }

    // Example: find all groups for a subject
    public function findAllBySubject($subject): array
    {
        return $this->createQueryBuilder('g')
            ->andWhere('g.subject = :subject')
            ->setParameter('subject', $subject)
            ->getQuery()
            ->getResult();
    }

    // You can add more custom queries here
}
